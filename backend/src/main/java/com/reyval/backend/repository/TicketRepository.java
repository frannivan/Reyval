package com.reyval.backend.repository;

import com.reyval.backend.entity.Ticket;
import com.reyval.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByReportadoPor(User user);
}
