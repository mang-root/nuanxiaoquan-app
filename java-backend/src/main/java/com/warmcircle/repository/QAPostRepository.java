package com.warmcircle.repository;

import com.warmcircle.entity.QAPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QAPostRepository extends JpaRepository<QAPost, Long> {
    Page<QAPost> findByParentIdIsNull(Pageable pageable);
    Page<QAPost> findByParentIdIsNullAndCategory(String category, Pageable pageable);
    List<QAPost> findByParentIdOrderByCreatedAtAsc(Long parentId);
}
