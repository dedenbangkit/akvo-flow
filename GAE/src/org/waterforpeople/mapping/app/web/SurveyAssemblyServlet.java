package org.waterforpeople.mapping.app.web;

import static com.google.appengine.api.labs.taskqueue.TaskOptions.Builder.url;

import java.util.List;

import org.waterforpeople.mapping.app.web.dto.SurveyAssemblyRequest;
import org.waterforpeople.mapping.dao.SurveyContainerDao;

import com.gallatinsystems.framework.rest.AbstractRestApiServlet;
import com.gallatinsystems.framework.rest.RestRequest;
import com.gallatinsystems.framework.rest.RestResponse;
import com.gallatinsystems.survey.dao.QuestionDao;
import com.gallatinsystems.survey.dao.QuestionQuestionGroupAssocDao;
import com.gallatinsystems.survey.dao.SurveyQuestionGroupAssocDao;
import com.gallatinsystems.survey.dao.SurveyXMLFragmentDao;
import com.gallatinsystems.survey.domain.Question;
import com.gallatinsystems.survey.domain.QuestionQuestionGroupAssoc;
import com.gallatinsystems.survey.domain.SurveyContainer;
import com.gallatinsystems.survey.domain.SurveyQuestionGroupAssoc;
import com.gallatinsystems.survey.domain.SurveyXMLFragment;
import com.gallatinsystems.survey.domain.SurveyXMLFragment.FRAGMENT_TYPE;
import com.google.appengine.api.datastore.Text;
import com.google.appengine.api.labs.taskqueue.Queue;
import com.google.appengine.api.labs.taskqueue.QueueFactory;

public class SurveyAssemblyServlet extends AbstractRestApiServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = -6044156962558183224L;

	@Override
	protected RestRequest convertRequest() throws Exception {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	protected RestResponse handleRequest(RestRequest req) throws Exception {
		RestResponse response = new RestResponse();
		SurveyAssemblyRequest importReq = (SurveyAssemblyRequest) req;
		if (SurveyAssemblyRequest.ASSEMBLE_SURVEY.equalsIgnoreCase(importReq
				.getAction())) {
			assembleSurvey(importReq.getSurveyId());
		} else if (SurveyAssemblyRequest.ASSEMBLE_QUESTION_GROUP
				.equalsIgnoreCase(importReq.getAction())) {
			assembleQuestionGroup(importReq.getSurveyId(), importReq
					.getQuestionGroupId(), importReq.getStartRow());
		}
		return null;
	}

	@Override
	protected void writeOkResponse(RestResponse resp) throws Exception {
		// TODO Auto-generated method stub

	}

	private void assembleSurvey(Long surveyId) {

		/**************
		 * 1, Select survey based on surveyId 2. Retrieve all question groups
		 * fire off queue tasks
		 */
		SurveyQuestionGroupAssocDao sqgadao = new SurveyQuestionGroupAssocDao();
		List<SurveyQuestionGroupAssoc> sqgaList = sqgadao
				.listBySurveyId(surveyId);
		for (SurveyQuestionGroupAssoc item : sqgaList) {
			Queue surveyAssemblyQueue = QueueFactory.getQueue("surveyAssembly");
			surveyAssemblyQueue.add(url("/app_worker/surveyassembly").param(
					"action", SurveyAssemblyRequest.ASSEMBLE_QUESTION_GROUP)
					.param("surveyId", surveyId.toString()).param(
							"questionGroupId",
							item.getQuestionGroupId().toString()));
		}

	}

	private void assembleQuestionGroup(Long surveyId, Long questionGroupId,
			Integer startRow) {
		QuestionQuestionGroupAssocDao qgqaDao = new QuestionQuestionGroupAssocDao();
		List<QuestionQuestionGroupAssoc> qqgaList = qgqaDao
				.listByQuestionGroupId(questionGroupId);
		QuestionDao questionDao = new QuestionDao();
		StringBuilder sb = new StringBuilder();
		int count = 0;
		int i = 0;

		for (count = startRow; count < qqgaList.size() && i < 10; count++) {
			i++;
			// get the question list
			// process 10 records and save then spawn new queue job
			Question q = questionDao.getByKey(qqgaList.get(count)
					.getQuestionId());
			sb.append(marshallQuestion(q));
		}
		SurveyXMLFragment sxf = new SurveyXMLFragment();
		sxf.setFragmentOrder(startRow / 10);
		sxf.setFragment(new Text(sb.toString()));
		if (count == (qqgaList.size() - 1)) {
			// Assemble the fragments
			Queue surveyAssemblyQueue = QueueFactory.getQueue("surveyAssembly");
			surveyAssemblyQueue.add(url("/app_worker/surveyassembly").param(
					"action", SurveyAssemblyRequest.ASSEMBLE_SURVEY_FRAGMENTS)
					.param("surveyId", surveyId.toString()));
		}
	}

	private String marshallQuestion(Question q) {
		return null;
	}

	private void assembleSurveyFragments(Long surveyId) {
		SurveyXMLFragmentDao sxmlfDao = new SurveyXMLFragmentDao();
		List<SurveyXMLFragment> sxmlfList = sxmlfDao.listSurveyFragments(
				surveyId, FRAGMENT_TYPE.QUESTION_GROUP);
		StringBuilder sbQuestionGroup = new StringBuilder();
		for (SurveyXMLFragment item : sxmlfList) {
			sbQuestionGroup.append(item.getFragment().toString());
		}

		StringBuilder completeSurvey = new StringBuilder();
		String surveyHeader = null;
		String surveyFooter = null;
		completeSurvey.append(surveyHeader);
		completeSurvey.append(sbQuestionGroup.toString());
		sbQuestionGroup = null;
		completeSurvey.append(surveyFooter);

		SurveyContainer sc = new SurveyContainer();
		sc.setSurveyDocument(new Text(completeSurvey.toString()));
		sc.setSurveyId(surveyId);
		SurveyContainerDao scDao = new SurveyContainerDao();
		scDao.save(sc);
	}
}