package com.reyval.backend.repository;

import com.reyval.backend.entity.Lead;
import com.reyval.backend.entity.ELeadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByStatus(ELeadStatus status);
}
