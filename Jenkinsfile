// ============================================================
// FinTrack Pro — Jenkinsfile
// Declarative pipeline: Checkout → Test → Build → Docker → Deploy
// ============================================================

pipeline {

    agent {
        docker {
            image 'eclipse-temurin:21-jdk-alpine'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        DOCKER_IMAGE      = 'fintrack-pro-backend'
        DOCKER_REGISTRY   = credentials('docker-hub-credentials')
        RENDER_BACKEND    = credentials('render-deploy-hook-backend')
        RENDER_FRONTEND   = credentials('render-deploy-hook-frontend')
        GEMINI_API_KEY    = credentials('gemini-api-key')
        SONAR_TOKEN       = credentials('sonarcloud-token')
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Cloning repository...'
                checkout scm
                script {
                    env.GIT_SHORT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.DOCKER_TAG    = "${env.BUILD_NUMBER}-${env.GIT_SHORT_SHA}"
                }
            }
        }

        stage('Backend: Test') {
            steps {
                dir('backend') {
                    echo 'Running backend unit and integration tests...'
                    sh './mvnw clean verify -Dspring.profiles.active=test -q'
                }
            }
            post {
                always {
                    junit 'backend/target/surefire-reports/*.xml'
                    jacoco(
                        execPattern: 'backend/target/jacoco.exec',
                        classPattern: 'backend/target/classes',
                        sourcePattern: 'backend/src/main/java'
                    )
                }
            }
        }

        stage('Frontend: Lint & Build') {
            agent {
                docker { image 'node:20-alpine' }
            }
            steps {
                dir('frontend') {
                    echo 'Installing frontend dependencies...'
                    sh 'npm ci'
                    echo 'Running type check and lint...'
                    sh 'npm run type-check && npm run lint'
                    echo 'Building frontend...'
                    sh 'VITE_API_BASE_URL=$RENDER_BACKEND_URL npm run build'
                }
            }
        }

        stage('Backend: Package JAR') {
            when {
                branch 'main'
            }
            steps {
                dir('backend') {
                    echo 'Building production JAR...'
                    sh './mvnw clean package -DskipTests -q'
                    archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
                }
            }
        }

        stage('Docker: Build & Push') {
            when {
                branch 'main'
            }
            steps {
                echo "Building Docker image: ${DOCKER_IMAGE}:${DOCKER_TAG}"
                sh """
                    docker build \
                        -t ${DOCKER_IMAGE}:${DOCKER_TAG} \
                        -t ${DOCKER_IMAGE}:latest \
                        ./backend
                """
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                    sh 'docker logout'
                }
            }
        }

        stage('Deploy to Render') {
            when {
                branch 'main'
            }
            steps {
                echo 'Triggering Render.com deployment...'
                sh """
                    curl -s -X POST \$RENDER_BACKEND && echo 'Backend deploy triggered'
                    curl -s -X POST \$RENDER_FRONTEND && echo 'Frontend deploy triggered'
                """
                echo 'Waiting for deployment...'
                sh 'sleep 60'
            }
        }

        stage('Health Check') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    STATUS=\$(curl -s -o /dev/null -w '%{http_code}' \
                        \${RENDER_BACKEND_URL}/actuator/health)
                    if [ "\$STATUS" != "200" ]; then
                        echo "Health check failed: HTTP \$STATUS"
                        exit 1
                    fi
                    echo "Deployment verified — backend is healthy"
                """
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded: Build #${env.BUILD_NUMBER} deployed to production"
        }
        failure {
            echo "Pipeline FAILED: Build #${env.BUILD_NUMBER}"
            // Add email/Slack notification here
        }
        cleanup {
            sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
            cleanWs()
        }
    }
}
