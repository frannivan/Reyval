# Build Stage
FROM maven:3.9.6-eclipse-temurin-11 AS build
WORKDIR /app

# Copy pom.xml and download dependencies to cache them
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:11-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Port will be injected by the cloud provider (Render/Koyeb)

# Optimización para arranque rápido y bajo consumo en memoria (Plan Gratuito)
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-Xss512k", "-XX:MaxRAMPercentage=70.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
