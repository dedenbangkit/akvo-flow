import React from 'react';
// eslint-disable-next-line import/no-unresolved
import AssignmentsEditView from 'akvo-flow/components/devices/AssignmentsEditView';
import observe from '../../mixins/observe';

// eslint-disable-next-line import/no-unresolved
require('akvo-flow/views/react-component');

// utils
FLOW.ArrNoDupe = function (a) {
  let gotIt;
  const templ = {};
  const tempa = Ember.A([]);
  for (let i = 0; i < a.length; i++) {
    templ[a.objectAt(i).clientId] = true;
  }
  const keys = Object.keys(templ);
  for (let j = 0; j < keys.length; j++) {
    gotIt = false;
    for (let i = 0; i < a.length; i++) {
      if (a.objectAt(i).clientId == keys[j] && !gotIt) {
        tempa.pushObject(a.objectAt(i));
        gotIt = true;
      }
    }
  }
  return tempa;
};

FLOW.formatDate = function (value) {
  if (!Ember.none(value)) {
    return `${value.getFullYear()}/${value.getMonth() + 1}/${value.getDate()}`;
  } return null;
};

FLOW.AssignmentEditView = FLOW.ReactComponentView.extend(
  observe({
    'this.assignmentName': 'validateAssignmentObserver',
    'FLOW.router.navigationController.selected': 'detectChangeTab',
    'FLOW.router.devicesSubnavController.selected': 'detectChangeTab',
    'FLOW.surveyControl.content.isLoaded': 'detectSurveyLoaded',
  }),
  {
    init() {
      this._super();
      this.setupControls();

      this.getProps = this.getProps.bind(this);
      this.cancelEditSurveyAssignment = this.cancelEditSurveyAssignment.bind(this);
      this.detectSurveyLoaded = this.detectSurveyLoaded.bind(this);
      this.renderReactSide = this.renderReactSide.bind(this);
      this.handleFormCheck = this.handleFormCheck.bind(this);
      this.canAddFormsToAssignment = this.canAddFormsToAssignment.bind(this);

      // object wide varaibles
      this.forms = {};
    },

    didInsertElement(...args) {
      this._super(...args);

      // react render
      this.renderReactSide();
    },

    renderReactSide() {
      const props = this.getProps();
      this.reactRender(<AssignmentsEditView {...props} />);
    },

    getProps() {
      const strings = {
        backToAssignmentList: Ember.String.loc('_go_back_to_assignment_list'),
        assignmentDetails: Ember.String.loc('_assignment_details'),
        assignmentName: Ember.String.loc('_assignment_name'),
        assignmentNamePlaceholder: Ember.String.loc('_enter_a_name_for_this_assignment'),
        startDate: Ember.String.loc('_start_date'),
        expireDate: Ember.String.loc('_expiration_date'),
        selectSurvey: Ember.String.loc('_select_survey'),
        cantFindYourSurvey: Ember.String.loc('_cant_find_your_survey_'),
        selectForms: Ember.String.loc('_select_forms'),
        selectDevices: Ember.String.loc('_select_devices'),
        selectDeviceGroup: Ember.String.loc('_select_device_group'),
        cancel: Ember.String.loc('_cancel'),
      };

      const inputValues = {
        assignmentName: FLOW.selectedControl.selectedSurveyAssignment.get('name'),
        startDate: FLOW.dateControl.fromDate,
        toDate: FLOW.dateControl.toDate,
      };

      const actions = {
        cancelEditSurveyAssignment: this.cancelEditSurveyAssignment,
        handleFormCheck: this.handleFormCheck,

      };

      const data = {
        forms: this.forms,
      };

      return {
        strings, actions, inputValues, data,
      };
    },

    cancelEditSurveyAssignment() {
      if (Ember.none(FLOW.selectedControl.selectedSurveyAssignment.get('keyId'))) {
        FLOW.selectedControl.get('selectedSurveyAssignment').deleteRecord();
      }
      FLOW.selectedControl.set('selectedSurveyAssignment', null);
      FLOW.router.transitionTo('navDevices.assignSurveysOverview');
    },

    // setups
    setupControls() {
      FLOW.selectedControl.set('selectedDevices', []);
      FLOW.selectedControl.set('selectedSurveys', []);
      FLOW.selectedControl.set('selectedSurveyGroup', null);
      FLOW.selectedControl.set('selectedDeviceGroup', null);
      FLOW.surveyControl.set('content', null);
      FLOW.devicesInGroupControl.set('content', null);

      let startDate = null;
      let endDate = null;

      if (FLOW.selectedControl.selectedSurveyAssignment.get('startDate') > 0) {
        startDate = new Date(FLOW.selectedControl.selectedSurveyAssignment.get('startDate'));
      }
      if (FLOW.selectedControl.selectedSurveyAssignment.get('endDate') > 0) {
        endDate = new Date(FLOW.selectedControl.selectedSurveyAssignment.get('endDate'));
      }
      FLOW.dateControl.set('fromDate', FLOW.formatDate(startDate));
      FLOW.dateControl.set('toDate', FLOW.formatDate(endDate));
    },

    // listeners
    detectSurveyLoaded() {
      this.forms = {};
      FLOW.surveyControl.content.forEach((form) => {
        this.forms[form.get('keyId')] = {
          name: form.get('name'),
          checked: this.formInAssignment(form.get('keyId')),
        };
      });

      this.renderReactSide();
    },

    detectChangeTab() {
      if (Ember.none(FLOW.selectedControl.selectedSurveyAssignment.get('keyId'))) {
        FLOW.selectedControl.get('selectedSurveyAssignment').deleteRecord();
      }
      FLOW.selectedControl.set('selectedSurveyAssignment', null);
    },

    // helpers
    formInAssignment(formId) {
      const formsInAssignment = FLOW.selectedControl.selectedSurveyAssignment.get('surveys');
      return formsInAssignment ? formsInAssignment.indexOf(formId) > -1 : false;
    },

    canAddFormsToAssignment() {
      // only allow if form qualifies
      const formsInAssignment = FLOW.selectedControl.selectedSurveyAssignment.get('surveys');
      const selectedSurveyGroupId = FLOW.selectedControl.selectedSurveyGroup.get('keyId');

      if (formsInAssignment && formsInAssignment.length > 0) {
        // get survey id of first form currently in assignment
        const preSelectedSurvey = FLOW.Survey.find(formsInAssignment[0]);
        if (preSelectedSurvey && preSelectedSurvey.get('keyId')) {
          return preSelectedSurvey.get('surveyGroupId') == selectedSurveyGroupId;
        }
      }

      return true; // no forms are currently added to the assignment
    },

    // handlers
    handleFormCheck(e) {
      // only allow a form to be checked if a different survey isn't already selected
      const formId = e.target.name;
      if (this.canAddFormsToAssignment()) {
        this.forms[formId].checked = !this.forms[formId].checked;
      } else {
        // TODO: display error that form cannot be added unless currently added forms are removed
      }

      this.renderReactSide();

      // add/remove form to/from assignment
      if (this.forms[formId].checked) {
        // push survey to FLOW.selectedControl.selectedSurveys
        FLOW.selectedControl.selectedSurveys.pushObject(FLOW.Survey.find(formId));
      } else {
        FLOW.selectedControl.selectedSurveys.removeObject(FLOW.Survey.find(formId));
      }

      // TODO: load data points in selected form
    },
  }
);
