FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
COPY frontend frontend

RUN mvn -B -f backend/pom.xml -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /workspace/backend/target/hostel-safety-management-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
