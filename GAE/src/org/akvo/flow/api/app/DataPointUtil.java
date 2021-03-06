/*
 *  Copyright (C) 2019 Stichting Akvo (Akvo Foundation)
 *
 *  This file is part of Akvo FLOW.
 *
 *  Akvo FLOW is free software: you can redistribute it and modify it under the terms of
 *  the GNU Affero General Public License (AGPL) as published by the Free Software Foundation,
 *  either version 3 of the License or any later version.
 *
 *  Akvo FLOW is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 *  without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *  See the GNU Affero General Public License included below for more details.
 *
 *  The full license text can also be seen at <http://www.gnu.org/licenses/agpl.html>.
 */

package org.akvo.flow.api.app;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.akvo.flow.domain.DataUtils;
import org.waterforpeople.mapping.app.web.dto.SurveyInstanceDto;
import org.waterforpeople.mapping.app.web.dto.SurveyedLocaleDto;
import org.waterforpeople.mapping.dao.QuestionAnswerStoreDao;
import org.waterforpeople.mapping.dao.SurveyInstanceDAO;
import org.waterforpeople.mapping.domain.QuestionAnswerStore;
import org.waterforpeople.mapping.domain.SurveyInstance;
import org.waterforpeople.mapping.serialization.response.MediaResponse;

import com.gallatinsystems.survey.dao.QuestionDao;
import com.gallatinsystems.survey.domain.Question;
import com.gallatinsystems.surveyal.domain.SurveyedLocale;
import com.google.api.server.spi.config.Nullable;

public class DataPointUtil {

    public List<SurveyedLocaleDto> getSurveyedLocaleDtosList(List<SurveyedLocale> slList, Long surveyId) {
        List<SurveyedLocaleDto> dtoList = new ArrayList<>();
        HashMap<Long, String> questionTypeMap = new HashMap<>();
        QuestionDao questionDao = new QuestionDao();

        List<Long> surveyedLocalesIds = getSurveyedLocalesIds(slList);
        Map<Long, List<SurveyInstance>> surveyInstancesMap = getSurveyInstances(surveyedLocalesIds);
        Map<Long, List<QuestionAnswerStore>> questionAnswerStore = getQuestionAnswerStoreMap(
                surveyInstancesMap);

        for (SurveyedLocale surveyedLocale : slList) {
            long surveyedLocaleId = surveyedLocale.getKey().getId();
            SurveyedLocaleDto dto = createSurveyedLocaleDto(surveyId, questionDao,
                    questionTypeMap, surveyedLocale, questionAnswerStore,
                    surveyInstancesMap.get(surveyedLocaleId));
            dtoList.add(dto);
        }
        return dtoList;
    }

    private SurveyedLocaleDto createSurveyedLocaleDto(Long surveyGroupId, QuestionDao questionDao,
            HashMap<Long, String> questionTypeMap, SurveyedLocale surveyedLocale,
            Map<Long, List<QuestionAnswerStore>> questionAnswerStoreMap,
            @Nullable List<SurveyInstance> surveyInstances) {
        SurveyedLocaleDto dto = new SurveyedLocaleDto();
        dto.setId(surveyedLocale.getIdentifier());
        dto.setSurveyGroupId(surveyGroupId);
        dto.setDisplayName(surveyedLocale.getDisplayName());
        dto.setLat(surveyedLocale.getLatitude());
        dto.setLon(surveyedLocale.getLongitude());
        dto.setLastUpdateDateTime(surveyedLocale.getLastUpdateDateTime());

        if (surveyInstances != null) {
            for (SurveyInstance surveyInstance : surveyInstances) {
                Long surveyInstanceId = surveyInstance.getObjectId();
                List<QuestionAnswerStore> answerStores = questionAnswerStoreMap
                        .get(surveyInstanceId);
                SurveyInstanceDto siDto = createSurveyInstanceDto(questionDao, questionTypeMap,
                        answerStores, surveyInstance);
                dto.getSurveyInstances().add(siDto);
            }
        }
        return dto;
    }

    /**
     * Returns a map of QuestionAnswerStore lists,
     * keys: surveyInstanceId, value: list of QuestionAnswerStore for that surveyInstance
     */
    private Map<Long, List<QuestionAnswerStore>> getQuestionAnswerStoreMap(
            Map<Long, List<SurveyInstance>> surveyInstanceMap) {
        QuestionAnswerStoreDao questionAnswerStoreDao = new QuestionAnswerStoreDao();
        List<Long> surveyInstancesIds = getSurveyInstancesIds(surveyInstanceMap);
        List<QuestionAnswerStore> questionAnswerList = questionAnswerStoreDao
                .fetchItemsByIdBatches(surveyInstancesIds, "surveyInstanceId");
        Map<Long, List<QuestionAnswerStore>> questionAnswerStoreMap = new HashMap<>();
        if (questionAnswerList != null && questionAnswerList.size() > 0) {
            for (QuestionAnswerStore questionAnswerStore : questionAnswerList) {
                // put them in a map with the surveyInstanceId as key
                Long surveyInstanceId = questionAnswerStore.getSurveyInstanceId();
                if (questionAnswerStoreMap.containsKey(surveyInstanceId)) {
                    questionAnswerStoreMap.get(surveyInstanceId).add(questionAnswerStore);
                } else {
                    ArrayList<QuestionAnswerStore> questionAnswerStores = new ArrayList<>();
                    questionAnswerStores.add(questionAnswerStore);
                    questionAnswerStoreMap.put(surveyInstanceId, questionAnswerStores);
                }
            }
        }
        return questionAnswerStoreMap;
    }

    private List<Long> getSurveyInstancesIds(Map<Long, List<SurveyInstance>> surveyInstanceMap) {
        List<Long> surveyInstancesIds = new ArrayList<>();
        Collection<List<SurveyInstance>> values = surveyInstanceMap.values();
        for (List<SurveyInstance> surveyInstances : values) {
            for (SurveyInstance surveyInstance: surveyInstances) {
                surveyInstancesIds.add(surveyInstance.getObjectId());
            }
        }
        return surveyInstancesIds;
    }

    /**
     * Fetches SurveyInstances using the surveyedLocalesIds and puts them in a map:
     * key: SurveyedLocalesId, value: list of SurveyInstances
     */
    private Map<Long, List<SurveyInstance>> getSurveyInstances(List<Long> surveyedLocalesIds) {
        SurveyInstanceDAO surveyInstanceDAO = new SurveyInstanceDAO();
        List<SurveyInstance> values = surveyInstanceDAO.fetchItemsByIdBatches(surveyedLocalesIds,
                "surveyedLocaleId");
        Map<Long, List<SurveyInstance>> surveyInstancesMap = new HashMap<>();
        for (SurveyInstance surveyInstance : values) {
            Long surveyedLocaleId = surveyInstance.getSurveyedLocaleId();
            if (surveyInstancesMap.containsKey(surveyedLocaleId)) {
                surveyInstancesMap.get(surveyedLocaleId).add(surveyInstance);
            } else {
                List<SurveyInstance> instances = new ArrayList<>();
                instances.add(surveyInstance);
                surveyInstancesMap.put(surveyedLocaleId, instances);
            }
        }
        return surveyInstancesMap;
    }

    private List<Long> getSurveyedLocalesIds(List<SurveyedLocale> slList) {
        if (slList == null) {
            return Collections.emptyList();
        }
        List<Long> surveyedLocaleIds = new ArrayList<>(slList.size());
        for (SurveyedLocale surveyedLocale : slList) {
            surveyedLocaleIds.add(surveyedLocale.getKey().getId());
        }
        return surveyedLocaleIds;
    }

    private SurveyInstanceDto createSurveyInstanceDto(QuestionDao qDao,
            HashMap<Long, String> questionTypeMap,
            @Nullable List<QuestionAnswerStore> questionAnswerStores,
            @Nullable SurveyInstance surveyInstance) {
        SurveyInstanceDto surveyInstanceDto = new SurveyInstanceDto();
        if (surveyInstance != null) {
            surveyInstanceDto.setUuid(surveyInstance.getUuid());
            surveyInstanceDto.setSubmitter(surveyInstance.getSubmitterName());
            surveyInstanceDto.setSurveyId(surveyInstance.getSurveyId());
            surveyInstanceDto.setCollectionDate(surveyInstance.getCollectionDate().getTime());
        }
        if (questionAnswerStores != null) {
            for (QuestionAnswerStore questionAnswerStore : questionAnswerStores) {
                Long questionId = questionAnswerStore.getQuestionIDLong();
                if (questionId == null) {
                    continue;// The question was deleted before storing the response.
                }
                String type = getQuestionType(qDao, questionTypeMap, questionAnswerStore);
                String value = getAnswerValue(questionAnswerStore, type);
                surveyInstanceDto.addProperty(questionId, value, type);
            }
        }
        return surveyInstanceDto;
    }

    private String getAnswerValue(QuestionAnswerStore questionAnswerStore, String type) {
        // Make all responses backwards compatible
        String answerValue = questionAnswerStore.getValue();
        String value = answerValue != null ? answerValue : "";
        switch (type) {
            case "OPTION":
            case "OTHER":
                if (value.startsWith("[")) {
                    value = DataUtils.jsonResponsesToPipeSeparated(value);
                }
                break;
            case "IMAGE":
            case "VIDEO":
                value = MediaResponse.format(value, MediaResponse.VERSION_STRING);
                break;
            default:
                break;
        }
        return value;
    }

    private String getQuestionType(QuestionDao questionDao, HashMap<Long, String> questionTypeMap,
            QuestionAnswerStore questionAnswerStore) {
        String type = questionAnswerStore.getType();
        if (type == null || "".equals(type)) {
            type = "VALUE";
        } else if ("PHOTO".equals(type)) {
            type = "IMAGE";
        } else if ("OPTION".equals(type)) {
            // first see if we have the question in the map already
            Long questionId = questionAnswerStore.getQuestionIDLong();
            if (questionTypeMap.containsKey(questionId)) {
                type = questionTypeMap.get(questionId);
            } else {
                // find question by id
                Question question = questionDao.getByKey(questionId);
                if (question != null) {
                    // if the question has the allowOtherFlag set,
                    // use OTHER as the device question type
                    if (question.getAllowOtherFlag()) {
                        type = "OTHER";
                    }
                    questionTypeMap.put(questionId, type);
                }
            }
        }
        return type;
    }
}
