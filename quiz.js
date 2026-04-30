// ════════════════════════════════════════════
// QUIZ QUESTIONS — 10 questions, 2 pts each = 20 pts max
// ════════════════════════════════════════════
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
    q: "Your friend sends: 'I am stuck, send me Rs.5000 urgently'. What do you do?",
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
    q: "A website shows a lock icon (https). This means?",
    options: ["The site is 100% safe", "Your connection is encrypted", "The site is government approved", "Your data is stored safely"],
    correct: 1
  }
]

// ════════════════════════════════════════════
// QUIZ STATE
// ════════════════════════════════════════════
let currentQuestion = 0
let quizScore       = 0
let quizStarted     = false

// ════════════════════════════════════════════
// START QUIZ
// ════════════════════════════════════════════
function startQuiz() {
  // Don't restart if already started
  if (quizStarted) return
  quizStarted     = true
  currentQuestion = 0
  quizScore       = 0
  loadQuestion(0)
}

// ════════════════════════════════════════════
// LOAD ONE QUESTION
// ════════════════════════════════════════════
function loadQuestion(index) {
  let data     = quizQuestions[index]
  let progress = document.getElementById('quiz-progress')
  let question = document.getElementById('quiz-question')
  let options  = document.getElementById('quiz-options')

  // Update progress
  progress.textContent = 'Question ' + (index + 1) + ' of ' + quizQuestions.length

  // Update question text
  question.textContent = data.q

  // Clear old buttons
  options.innerHTML = ''

  // Create answer buttons
  data.options.forEach(function(optionText, i) {
    let btn         = document.createElement('button')
    btn.textContent = optionText

    btn.addEventListener('click', function() {
      selectAnswer(i, data.correct, options)
    })

    options.appendChild(btn)
  })
}

// ════════════════════════════════════════════
// HANDLE ANSWER SELECTION
// ════════════════════════════════════════════
function selectAnswer(chosen, correct, optionsDiv) {
  let buttons = optionsDiv.querySelectorAll('button')

  // Disable all buttons immediately
  buttons.forEach(function(btn) {
    btn.disabled = true
  })

  // Show correct answer in green
  buttons[correct].classList.add('correct')

  // Show wrong answer in red if user picked wrong
  if (chosen !== correct) {
    buttons[chosen].classList.add('wrong')
  } else {
    // Correct! Add 2 points
    quizScore = quizScore + 2
  }

  // Wait 1 second then move to next question
  setTimeout(function() {
    currentQuestion = currentQuestion + 1

    if (currentQuestion < quizQuestions.length) {
      loadQuestion(currentQuestion)
    } else {
      finishQuiz()
    }
  }, 1000)
}

// ════════════════════════════════════════════
// QUIZ FINISHED
// ════════════════════════════════════════════
function finishQuiz() {
  // Save quiz score to global scores object
  scores.quiz = quizScore

  // Hide quiz section
  document.getElementById('quiz-section').style.display = 'none'

  // Update score display
  updateScoreDisplay()

  // Show 2FA checklist after quiz finishes
  document.getElementById('twofa-section').style.display = 'block'

  // Show result message
  let msg = document.getElementById('quiz-result-msg')
  if (msg) {
    msg.style.display = 'block'
    if (quizScore >= 16) {
      msg.style.background = '#c6f6d5'
      msg.style.border     = '1px solid #38a169'
      msg.textContent      = '🎉 Quiz done! You scored ' + quizScore + ' / 20. Great awareness!'
    } else if (quizScore >= 10) {
      msg.style.background = '#fefcbf'
      msg.style.border     = '1px solid #d69e2e'
      msg.textContent      = '📚 Quiz done! You scored ' + quizScore + ' / 20. Keep learning!'
    } else {
      msg.style.background = '#fed7d7'
      msg.style.border     = '1px solid #e53e3e'
      msg.textContent      = '⚠️ Quiz done! You scored ' + quizScore + ' / 20. Please improve your cyber awareness!'
    }
  }
}