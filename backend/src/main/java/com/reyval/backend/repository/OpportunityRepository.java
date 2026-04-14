package com.reyval.backend.repository;

import com.reyval.backend.entity.Opportunity;
import com.reyval.backend.entity.EOpportunityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {
    List<Opportunity> findByStatus(EOpportunityStatus status);
}
