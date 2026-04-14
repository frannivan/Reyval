package com.reyval.backend.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import com.reyval.backend.payload.response.MessageResponse;
import java.nio.file.AccessDeniedException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<MessageResponse> handleBadCredentials(BadCredentialsException ex) {
        logger.error("Authentication failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse("Credenciales erróneas. Por favor verifica tu usuario y contraseña."));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<MessageResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        logger.error("File upload limit exceeded: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED)
                .body(new MessageResponse("El archivo es demasiado grande. El límite es 10MB."));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<MessageResponse> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        logger.error("Access denied error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new MessageResponse("No tienes permisos para acceder a este recurso."));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponse> handleValidationExceptions(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        logger.error("Validation error: {}", ex.getMessage());
        String errorMessage = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Error de validación: " + errorMessage));
    }

    @ExceptionHandler(javax.persistence.EntityNotFoundException.class)
    public ResponseEntity<MessageResponse> handleEntityNotFound(javax.persistence.EntityNotFoundException ex) {
        logger.error("Entity not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new MessageResponse("El recurso solicitado no existe."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MessageResponse> handleIllegalArgument(IllegalArgumentException ex) {
        logger.error("Illegal argument error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleGlobalException(Exception ex) {
        logger.error("SERVER ERROR (Technical detail): ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error en la comunicación con el servidor. Por favor, intenta más tarde."));
    }
}
