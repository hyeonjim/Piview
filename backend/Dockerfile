FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN sed -i 's/\r$//' ./gradlew && chmod +x ./gradlew

COPY checkstyle checkstyle
COPY src src
RUN ./gradlew clean build -x test

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=builder /app/build/libs/app.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar","app.jar"]
