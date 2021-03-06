import { isNaN } from 'lodash';
import observe from '../../mixins/observe';
import template from '../../mixins/template';

// this function is also present in assignment-edit-views.js, we need to consolidate using moment.js

function formatDate(date) {
  if (date && !isNaN(date.getTime())) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
  return null;
}

function sortByOrder(a, b) {
  return a.get('order') - b.get('order');
}

FLOW.QuestionAnswerView = Ember.View.extend(observe({
  'this.numberValue': 'doValidateNumber',
}), {

  isTextType: Ember.computed(function () {
    return this.get('questionType') === 'FREE_TEXT';
  }).property('this.questionType'),

  isCascadeType: Ember.computed(function () {
    return this.get('questionType') === 'CASCADE';
  }).property('this.questionType'),

  isOptionType: Ember.computed(function () {
    return this.get('questionType') === 'OPTION';
  }).property('this.questionType'),

  isNumberType: Ember.computed(function () {
    return this.get('questionType') === 'NUMBER';
  }).property('this.questionType'),

  isBarcodeType: Ember.computed(function () {
    return this.get('questionType') === 'SCAN';
  }).property('this.questionType'),

  isDateType: Ember.computed(function () {
    return this.get('questionType') === 'DATE';
  }).property('this.questionType'),

  isPhotoType: Ember.computed(function () {
    return (this.get('questionType') === 'PHOTO' || (this.content && this.content.get('type') === 'IMAGE'));
  }).property('this.questionType'),

  isVideoType: Ember.computed(function () {
    return this.get('questionType') === 'VIDEO';
  }).property('this.questionType'),

  isGeoShapeType: Ember.computed(function () {
    return this.get('questionType') === 'GEOSHAPE';
  }).property('this.questionType'),

  isSignatureType: Ember.computed(function () {
    return this.get('questionType') === 'SIGNATURE' || (this.content && this.content.get('type') === 'SIGNATURE');
  }).property('this.questionType'),

  isCaddisflyType: Ember.computed(function () {
    return this.get('questionType') === 'CADDISFLY' || (this.content && this.content.get('type') === 'CADDISFLY');
  }).property('this.questionType'),

  nonEditableQuestionTypes: ['GEO', 'PHOTO', 'VIDEO', 'GEOSHAPE', 'SIGNATURE', 'CADDISFLY'],

  form: Ember.computed(() => {
    if (FLOW.selectedControl.get('selectedSurvey')) {
      return FLOW.selectedControl.get('selectedSurvey');
    }
  }).property('FLOW.selectedControl.selectedSurvey'),

  /*
   * Get the full list of options related to a particular option type question
   */
  optionsList: Ember.computed(function () {
    const c = this.content;
    if (Ember.none(c) || !this.get('isOptionType')) {
      return Ember.A([]);
    }

    const questionId = c.get('questionID');

    const options = FLOW.store.filter(FLOW.QuestionOption, item => item.get('questionId') === +questionId);

    const optionArray = options.toArray();
    optionArray.sort((a, b) => a.get('order') - b.get('order'));

    const tempList = Ember.A([]);
    optionArray.forEach((item) => {
      const obj = Ember.Object.create({
        code: item.get('code') && item.get('code').trim(),
        text: item.get('text').trim(),
        order: item.get('order'),
      });
      tempList.push(obj);
    });

    // add other option if enabed
    // we assume codes are all or nothing
    const setOptionCodes = tempList.get('firstObject').get('code');
    if (this.get('isOtherOptionEnabled')) {
      tempList.push(Ember.Object.create({
        code: setOptionCodes ? 'OTHER' : null, // OTHER is default code
        otherText: null,
        text: Ember.computed(function () {
          const suffix = this.get('otherText') ? this.get('otherText') : Ember.String.loc('_other_option_specify');
          return `${Ember.String.loc('_other')}: ${suffix}`;
        }).property('this.otherText'),
        order: tempList.get('length'),
        isOther: true,
      }));
    }
    return tempList;
  }).property('this.content'),

  content: null,

  inEditMode: false,

  isNotEditable: Ember.computed(function () {
    // keep this property to limit template rafactoring
    return !this.get('isEditable');
  }).property('this.isEditable'),

  isEditable: Ember.computed(function () {
    const isEditableQuestionType = this.nonEditableQuestionTypes.indexOf(this.get('questionType')) < 0;
    if (!isEditableQuestionType) {
      return false; // no need to check permissions
    }
    const canEditFormResponses = FLOW.permControl.canEditResponses(this.get('form'));
    return isEditableQuestionType && canEditFormResponses;
  }).property('this.questionType,this.form'),

  date: null,

  /*
   *  Extract base64 signature image data and convert to src attribute for
   *  HTML img tag
   */
  signatureImageSrc: Ember.computed(function () {
    const c = this.content;
    const srcAttr = 'data:image/png;base64,';
    if (c && c.get('value')) {
      const signatureJson = JSON.parse(c.get('value'));
      return srcAttr + signatureJson.image;
    }
    return null;
  }).property('this.content'),

  /*
   * Extract signatory from signature response
   */
  signatureSignatory: Ember.computed(function () {
    const c = this.content;
    if (c && c.get('value')) {
      const signatureJson = JSON.parse(c.get('value'));
      return signatureJson.name.trim();
    }
    return null;
  }).property('this.content'),

  /*
  * Parse the caddisfly test JSON result
  * Extracts the 'result' key from a json string, and parses the array of results.
  * Creates an array with name, value, unit for each result
  * Example JSON format: {"result":[{"name":"Total Chlorine (ppm)","value":10,
  * "unit":"ppm","id":0},{"name":"Free Chlorine (ppm)","value":0.5,"unit":"ppm",
  * "id":1}],"type":"caddisfly","name":"Chlorine and Free Chlorine",
  * "uuid":"bf1c19c0-9788-4e26-999e-1b5c6ca28111",
  * "image":"b3893f16-6a02-4e92-a13e-fce25223a0c5.png"}
  */
  parseTestJson() {
    const c = this.content;
    let result = Ember.A();
    if (c && c.get('value')) {
      const testJson = JSON.parse(c.get('value'));
      if (testJson.result && !Ember.empty(testJson.result)) {
        result = Ember.A(testJson.result);
      }
    }
    this.set('testResult', result);
  },

  /*
   * Get out the caddisfly test name
   *
   * Example JSON format: {"result":[{"name":"Total Chlorine (ppm)","value":10,
   * "unit":"ppm","id":0},{"name":"Free Chlorine (ppm)","value":0.5,"unit":"ppm",
   * "id":1}],"type":"caddisfly","name":"Chlorine and Free Chlorine",
   * "uuid":"bf1c19c0-9788-4e26-999e-1b5c6ca28111",
   * "image":"b3893f16-6a02-4e92-a13e-fce25223a0c5.png"}
   *
   * Extracts the 'name' attribute from a Caddisfly JSON result string
   */
  testName: Ember.computed(function () {
    const c = this.content;
    if (c && c.get('value')) {
      const testJson = JSON.parse(c.get('value'));
      if (!Ember.empty(testJson.result)) {
        this.parseTestJson();
      }
      if (!Ember.empty(testJson.name)) {
        return testJson.name.trim();
      }
    }
    return null;
  }).property('this.content'),

  /*
   * Get out the caddisfly image URL
   *
   * Example JSON format: {"result":[{"name":"Total Chlorine (ppm)","value":10,
   * "unit":"ppm","id":0},{"name":"Free Chlorine (ppm)","value":0.5,"unit":"ppm",
   * "id":1}],"type":"caddisfly","name":"Chlorine and Free Chlorine",
   * "uuid":"bf1c19c0-9788-4e26-999e-1b5c6ca28111",
   * "image":"b3893f16-6a02-4e92-a13e-fce25223a0c5.png"}
   *
   * Extracts the 'image' attribute from a Caddisfly JSON result string, and returns a full URL
   */
  caddisflyImageURL: Ember.computed(function () {
    const c = this.content;
    if (c && c.get('value')) {
      const testJson = JSON.parse(c.get('value'));
      if (!Ember.empty(testJson.image)) {
        return FLOW.Env.photo_url_root + testJson.image.trim();
      }
    }
    return null;
  }).property('this.content'),

  numberValue: null,

  cascadeValue: Ember.computed(function (key, value) {
    const c = this.content;
    // setter
    if (arguments.length > 1) {
      // split according to pipes
      const cascadeNames = value.split('|');
      const cascadeResponse = [];
      cascadeNames.forEach((item) => {
        if (item.trim().length > 0) {
          cascadeResponse.push({ name: item.trim() });
        }
      });

      c.set('value', JSON.stringify(cascadeResponse));
    }

    // getter
    let cascadeString = '';
    let cascadeJson;
    if (c && c.get('value')) {
      if (c.get('value').indexOf('|') > -1) {
        cascadeString += c.get('value');
      } else {
        cascadeJson = JSON.parse(c.get('value'));
        cascadeString = cascadeJson.map(item => item.name).join('|');
      }
      return cascadeString;
    }
    return null;
  }).property('this.content'),

  /* object properties to include when transforming selected options
   * to string to store in the datastore
   */
  optionValueProperties: ['code', 'text', 'isOther'],

  /*
   *  An Ember array consisting of selected elements from the optionsList.
   *  This is later serialised into a string response for the datastore.
   */
  selectedOptionValues: null,

  /*
   *  A view property to set and retrieve the selectedOptionValues array
   *
   *  At first load, the getter block uses the string response from the datastore
   *  to create an Ember array consisting of the corresponding elements from the
   *  optionsList property, i.e, selected elements of the optionsList.
   *
   *  Retrieved string responses could be:
   *   - pipe-separated strings for legacy format e.g. 'text1|text2'
   *   - JSON string in the current format e.g
   *    '[{text: "text with code", code: "code"}]'
   *    '[{text: "only text"}]'
   */
  optionValue: Ember.computed(function (key, value) {
    const c = this.content;

    // setter
    if (arguments.length > 1) {
      this.set('selectedOptionValues', value);
    }

    // getter
    // initial selection setup
    if (!this.get('selectedOptionValues')) {
      this.set('selectedOptionValues', this.parseOptionsValueString(c.get('value')));
    }
    return this.get('selectedOptionValues');
  }).property('this.selectedOptionValues'),

  /*
   *  Used to parse a provided string response from the value property of an option question.
   *  Returns an Ember array consisting of the corresponding elements from the optionsList
   *  property, i.e, selected elements of the optionsList.
   *
   *  The string responses could be:
   *   - pipe-separated strings for legacy format e.g. 'text1|text2'
   *   - JSON string in the current format e.g
   *    '[{text: "text with code", code: "code"}]'
   *    '[{text: "only text"}]'
   */
  parseOptionsValueString(optionsValueString) {
    if (!optionsValueString) {
      return Ember.A();
    }

    const selectedOptions = Ember.A();
    const optionsList = this.get('optionsList');
    const isOtherEnabled = this.get('isOtherOptionEnabled');

    if (optionsValueString.charAt(0) === '[') {
      // responses in JSON format
      JSON.parse(optionsValueString).forEach((response) => {
        optionsList.forEach((optionObj) => {
          if (response.text === optionObj.get('text')
              && response.code == optionObj.get('code')) { // '==' because codes could be undefined or null
            selectedOptions.addObject(optionObj);
          }

          // add other
          if (response.isOther && optionObj.get('isOther') && isOtherEnabled) {
            optionObj.set('otherText', response.text);
            selectedOptions.addObject(optionObj);
          }
        });
      });
    } else {
      // responses in pipe separated format
      optionsValueString.split('|').forEach((item, textIndex, textArray) => {
        const text = item.trim();
        const isLastItem = textIndex === textArray.length - 1;
        if (text.length > 0) {
          optionsList.forEach((optionObj) => {
            const optionIsIncluded = optionObj.get('text') && optionObj.get('text') === text;
            if (optionIsIncluded) {
              selectedOptions.addObject(optionObj);
            }

            // add other
            if (!optionIsIncluded && optionObj.get('isOther') && isOtherEnabled && isLastItem) {
              optionObj.set('otherText', text);
              selectedOptions.addObject(optionObj);
            }
          });
        }
      });
    }

    return selectedOptions.sort(sortByOrder);
  },

  /*
   *  A property to enable setting and getting of the selected element
   *  of a single-select option question.
   *
   */
  singleSelectOptionValue: Ember.computed(function (key, value) {
    let selectedOptions;
    const c = this.content;

    // setter
    if (c && arguments.length > 1) {
      selectedOptions = Ember.A();
      selectedOptions.push(value);
      this.set('optionValue', selectedOptions);
    }

    // getter
    const options = this.get('optionValue');
    if (options && options.get('length') === 1) {
      return options.get('firstObject');
    }
    return null;
  }).property('this.optionValue'),

  /*
   *  A property to enable setting and getting of the selected element
   *  of a multi-select option question.
   *
   */
  multiSelectOptionValue: Ember.computed(function (key, value) {
    const c = this.content;

    // setter
    if (c && arguments.length > 1) {
      this.set('optionValue', value);
    }

    // getter
    return this.get('optionValue');
  }).property('this.optionValue'),

  isMultipleSelectOption: Ember.computed(function () {
    return this.get('isOptionType') && this.get('question').get('allowMultipleFlag');
  }).property('this.isOptionType'),

  isOtherOptionEnabled: Ember.computed(function () {
    return this.get('isOptionType') && this.get('question').get('allowOtherFlag');
  }).property('this.isOptionType'),

  isOtherOptionSelected: Ember.computed(function () {
    const selectedOption = this.get('optionValue') && this.get('optionValue').get('lastObject');
    return selectedOption && selectedOption.get('isOther');
  }).property('this.optionValue'),

  photoUrl: Ember.computed(function () {
    const c = this.content;
    if (!Ember.empty(c.get('value'))) {
      const jImage = JSON.parse(c.get('value'));
      if (jImage && jImage.filename) {
        return FLOW.Env.photo_url_root + jImage.filename.split('/').pop();
      }
    }
  }).property('this.content,this.isPhotoType,this.isVideoType'),

  photoLocation: Ember.computed(function () {
    const c = this.content;
    if (!Ember.empty(c.get('value'))) {
      const jImage = JSON.parse(c.get('value'));
      if (jImage && jImage.location) {
        return `lat:${jImage.location.latitude}/lon:${jImage.location.longitude}`;
      }
    }
  }).property('this.content,this.isPhotoType,this.isVideoType'),

  geoShapeObject: Ember.computed(function () {
    const c = this.content;
    if (!Ember.empty(c.get('value'))) {
      return c.get('value');
    }
  }).property('this.content,this.isGeoShapeType'),

  questionType: Ember.computed(function () {
    if (this.get('question')) {
      return this.get('question').get('type');
    }
  }).property('this.question'),

  question: Ember.computed(function () {
    const c = this.get('content');
    if (c) {
      const questionId = c.get('questionID');
      const q = FLOW.questionControl.findProperty('keyId', +questionId);
      return q;
    }
  }).property('this.content'),

  doEdit() {
    this.set('inEditMode', true);
    const c = this.content;

    if (this.get('isDateType') && !Ember.empty(c.get('value'))) {
      const d = new Date(+c.get('value')); // need to coerce c.get('value') due to milliseconds
      this.set('date', formatDate(d));
    }

    if (this.get('isNumberType') && !Ember.empty(c.get('value'))) {
      this.set('numberValue', c.get('value'));
    }
  },

  doCancel() {
    this.set('inEditMode', false);
  },

  doSave() {
    if (this.get('isDateType')) {
      const d = Date.parse(this.get('date'));
      if (isNaN(d) || d < 0) {
        this.content.set('value', null);
      } else {
        this.content.set('value', d);
      }
    }

    if (this.get('isNumberType')) {
      if (isNaN(this.numberValue)) {
        this.content.set('value', null);
      } else {
        this.content.set('value', this.numberValue);
      }
    }

    if (this.get('isOptionType')) {
      const responseArray = [];
      this.get('selectedOptionValues').forEach((option) => {
        const obj = {};
        if (option.get('code')) {
          obj.code = option.get('code');
        }
        if (option.get('isOther')) {
          obj.isOther = option.get('isOther');
          obj.text = option.get('otherText');
        } else {
          obj.text = option.get('text');
        }
        responseArray.push(obj);
      });
      this.content.set('value', JSON.stringify(responseArray));
    }
    FLOW.store.commit();
    this.set('inEditMode', false);
  },

  doValidateNumber() {
    // TODO should check for minus sign and decimal point, depending on question setting
    this.set('numberValue', this.get('numberValue').toString().replace(/[^\d.]/g, ''));
  },

  popupMedia() {
    if (this.get('photoUrl')) {
      FLOW.dialogControl.set('activeAction', 'ignore');
      FLOW.dialogControl.set('header', '');
      FLOW.dialogControl.set('message', Ember.String.htmlSafe(`<img src="${this.get('photoUrl')}">`));
      FLOW.dialogControl.set('showCANCEL', false);
      FLOW.dialogControl.set('showDialog', true);
    }
  },
});

FLOW.QuestionAnswerOptionListView = Ember.CollectionView.extend({
  tagName: 'ul',
  content: null,
  itemViewClass: Ember.View.extend({
    template: Ember.Handlebars.compile('{{view.content.text}}'),
  }),
});

/**
 * Multi select option editing view that renders question options with the allow
 * multiple option selected.  The selection property should be a set of options
 * that are considered to be selected (checked).  Whenever each options checkbox
 * is modified, the set bound to the selection property is updated to add or remove
 * the item.
 *
 * The inline view template displays the selected option's text with its corresponding
 * checkbox and if the 'allow other' flag is set on the question, it displays in addition
 * a text box to enable editing the other response text.
 */
FLOW.QuestionAnswerMultiOptionEditView = Ember.CollectionView.extend({
  tagName: 'ul',
  content: null,
  selection: null,
  itemViewClass: Ember.View.extend({
    template: Ember.Handlebars.compile('{{view Ember.Checkbox checkedBinding="view.isSelected"}} {{view.content.text}}'),
    isSelected: Ember.computed(function (key, checked) {
      const selectedOptions = this.get('parentView').get('selection');
      const newSelectedOptions = Ember.A();

      // setter
      if (arguments.length > 1) {
        if (checked) {
          selectedOptions.addObject(this.content);
        } else {
          selectedOptions.removeObject(this.content);
        }
        selectedOptions.forEach((option) => {
          newSelectedOptions.push(option);
        });

        // Using a copy of the selected options 'newSelectedOptions' in order
        // to trigger the setter property of the object bound to 'parentView.selection'
        this.set('parentView.selection', newSelectedOptions);
      }

      // getter
      return selectedOptions && selectedOptions.contains(this.content);
    }).property('this.content'),
  }),
});

FLOW.QuestionAnswerInspectDataView = FLOW.QuestionAnswerView.extend(template('navData/question-answer'));

FLOW.QuestionAnswerMonitorDataView = FLOW.QuestionAnswerView.extend(template('navData/question-answer'), {
  doEdit() { // override the doEdit action in the parentView
    this._super();
    this.set('inEditMode', false);
  },
});
