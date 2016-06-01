node {
    stage 'Checkout'
    // Checkout code from repository
   checkout scm
   
  def nodeHome = tool name: 'node-default'
  sh "${nodeHome}/bin/node -v"
  env.PATH = "${nodeHome}/bin:${env.PATH}"

   // Mark the code build 'stage'....
   stage 'Build'
   sh "npm i"
}
