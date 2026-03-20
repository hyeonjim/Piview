package com.piview.backend.skin.survey.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.piview.backend.domain.skin.survey.service.SurveySkinProblemMapper;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.piview.backend.global.exception.CustomException;

class SurveySkinProblemMapperTest {

    private final SurveySkinProblemMapper surveySkinProblemMapper = new SurveySkinProblemMapper();

    @Test
    void mapToTags_returnsMappedTagsForSingleAndMultiMappedSelections() {
        List<String> mappedTags = surveySkinProblemMapper.mapToTags(
            List.of("기미/주근깨/잡티", "홍조", "각질")
        );

        assertThat(mappedTags).containsExactly("색소침착", "홍조", "진정", "수분", "영양");
    }

    @Test
    void mapToTags_removesDuplicateTagsWhilePreservingOrder() {
        List<String> mappedTags = surveySkinProblemMapper.mapToTags(
            List.of("속건조", "각질", "홍조", "홍조")
        );

        assertThat(mappedTags).containsExactly("수분", "영양", "홍조", "진정");
    }

    @Test
    void mapToTags_throwsCustomExceptionWhenUnsupportedSelectionIsProvided() {
        assertThatThrownBy(() -> surveySkinProblemMapper.mapToTags(List.of("기미")))
            .isInstanceOf(CustomException.class);
    }
}
