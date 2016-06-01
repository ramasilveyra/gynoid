node {
    stage 'Checkout'
    // Checkout code from repository
    checkout scm
   
    def nodeHome = tool name: 'node-default'
    sh "${nodeHome}/bin/node -v"
    env.PATH = "${nodeHome}/bin:${env.PATH}"
  

    stage 'Build'
    sh "echo npm -v"
    sh "npm i"
    
}
