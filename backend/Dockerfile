# ─── Build Stage ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# ─── Runtime Stage ──────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S klu && adduser -S klu -G klu
COPY --from=builder /app/target/*.jar app.jar
RUN chown klu:klu app.jar

# ─── Environment Variables (Hardcoded Defaults) ──────────────────────────────
ENV SPRING_DATASOURCE_URL="jdbc:postgresql://ep-holy-rain-apg9pcaw-pooler.c-7.us-east-1.aws.neon.tech/CertificationVerificationDB?sslmode=require&channel_binding=require"
ENV SPRING_DATASOURCE_USERNAME="neondb_owner"
ENV SPRING_DATASOURCE_PASSWORD="npg_koXIUMB7Fx1R"
ENV REDIS_HOST="host.docker.internal"
ENV REDIS_PORT=6379
ENV JWT_SECRET="klu-certification-platform-super-secret-key-2024-enterprise-grade"
ENV JWT_EXPIRATION=86400000

USER klu
EXPOSE 8080 9092
ENTRYPOINT ["java", "-jar", "-Djava.security.egd=file:/dev/./urandom", "app.jar"]
