# ============================================================
# FinTrack Pro — Backend Dockerfile (multi-stage)
# Stage 1: Build with Maven
# Stage 2: Run with minimal JRE (distroless)
# ============================================================

# ---- Build Stage ----
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and pom.xml first (layer caching)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Copy source and build
COPY src/ src/
RUN ./mvnw clean package -DskipTests -q

# ---- Runtime Stage ----
FROM eclipse-temurin:21-jre-alpine AS runtime

# Security: run as non-root user
RUN addgroup -S fintrack && adduser -S fintrack -G fintrack

WORKDIR /app

# Copy the built JAR
COPY --from=builder /build/target/fintrack-pro-*.jar app.jar

# Set ownership
RUN chown fintrack:fintrack app.jar

USER fintrack

# Render.com uses the PORT environment variable
EXPOSE 8080

# JVM tuning for containerised environments
ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:prod}", \
    "-jar", "app.jar"]
