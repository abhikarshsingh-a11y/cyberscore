// ---- QUIZ QUESTIONS ----
// Each question has: question text, 4 options, correct answer index (0=A, 1=B, 2=C, 3=D)
let quizQuestions = [
  {
    q: "You get a call from 'bank support' asking for your OTP. What do you do?",
    options: ["Share OTP quickly", "Hang up immediately", "Ask for their name", "Call back later"],
    correct: 1
  },
  {
    q: "Which password is the strongest?",
    options: ["rahul123", "Rahul@1234", "Tr!9#mK@2vL", "password"],
    correct: 2
  },
  {
    q: "You receive a WhatsApp link: 'Win free iPhone! Click now'. What do you do?",
    options: ["Click and check", "Forward to friends", "Delete immediately", "Save the link"],
    correct: 2
  },
  {
    q: "What does 2FA (Two Factor Authentication) do?",
    options: ["Doubles your password", "Adds a second security step", "Locks your account", "Resets your password"],
    correct: 1
  },
  {
    q: "You are on public WiFi at a cafe. What should you AVOID?",
    options: ["Reading news", "Online banking", "Watching videos", "Checking weather"],
    correct: 1
  },
  {
    q: "What is phishing?",
    options: ["A type of fishing sport", "Fake messages to steal your data", "A security software", "A strong password method"],
    correct: 1
  },
  {
    q: "Your friend sends a message: 'I am stuck, send me Rs.5000 urgently'. What do you do?",
    options: ["Send money immediately", "Call your friend directly to verify", "Send half the amount", "Ignore forever"],
    correct: 1
  },
  {
    q: "How often should you update your passwords?",
    options: ["Never", "Every 5 years", "Every 3-6 months", "Only when hacked"],
    correct: 2
  },
  {
    q: "Which of these is safe to share publicly on social media?",
    options: ["Your Aadhaar number", "Your home address", "Your favourite movie", "Your phone number"],
    correct: 2
  },
  {
    q: "A website shows a lock icon (https) in the browser. This means?",
    options: ["The site is 100% safe", "Your connection is encrypted", "The site is government approved", "Your data is stored safely"],
    correct: 1
  }
]

// ---- QUIZ STATE ----
let currentQuestion = 0
let quizScore       = 0

// ---- START QUIZ ----
function startQuiz() {
  currentQuestion = 0
  quizScore       = 0
  loadQuestion(0)
}

// ---- LOAD ONE QUESTION ----
function loadQuestion(index) {
  let data     = quizQuestions[index]
  let progress = document.getElementById('quiz-progress')
  let question = document.getElementById('quiz-question')
  let options  = document.getElementById('quiz-options')

  // Update progress text
  progress.textContent = 'Question ' + (index + 1) + ' of ' + quizQuestions.length

  // Update question text
  question.textContent = data.q

  // Clear old answer buttons
  options.innerHTML = ''

  // Create a button for each option
  data.options.forEach(function(optionText, i) {
    let btn       = document.createElement('button')
    btn.textContent = optionText

    // When user clicks an answer
    btn.addEventListener('click', function() {
      selectAnswer(i, data.correct, options)
    })

    options.appendChild(btn)
  })
}

// ---- HANDLE ANSWER SELECTION ----
function selectAnswer(chosen, correct, optionsDiv) {
  let buttons = optionsDiv.querySelectorAll('button')

  // Disable all buttons so user cannot change answer
  buttons.forEach(function(btn) {
    btn.disabled = true
  })

  // Highlight correct answer green
  buttons[correct].classList.add('correct')

  // If wrong, highlight chosen red
  if (chosen !== correct) {
    buttons[chosen].classList.add('wrong')
  } else {
    // Correct answer — add 2 points
    quizScore = quizScore + 2
  }

  // Wait 1 second then move to next question
  setTimeout(function() {
    currentQuestion = currentQuestion + 1

    if (currentQuestion < quizQuestions.length) {
      // Load next question
      loadQuestion(currentQuestion)
    } else {
      // Quiz finished!
      finishQuiz()
    }
  }, 1000)
}

// ---- QUIZ FINISHED ----
function finishQuiz() {
  // Save quiz score to global scores object
  scores.quiz = quizScore

  // Hide quiz section
  document.getElementById('quiz-section').style.display = 'none'

  // Update the score display
  updateScoreDisplay()

  // Show final message
  alert('Quiz done! You scored ' + quizScore + ' / 20')
}