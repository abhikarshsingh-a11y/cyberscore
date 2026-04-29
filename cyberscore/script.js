// ---- SCORE STATE ----
// This object holds the score for each module
let scores = {
  password: 0,
  breach:   0,
  quiz:     0,
  twofa:    0
}

// ---- UPDATE SCORE DISPLAY ----
// Call this function whenever any module score changes
function updateScoreDisplay() {
  // Add up all module scores
  let total = scores.password + scores.breach + scores.quiz + scores.twofa

  // Show the number on screen
  document.getElementById('score-number').textContent = total

  // Get the circle element
  let circle = document.getElementById('score-circle')

  // Remove all color classes first
  circle.classList.remove('score-red', 'score-orange', 'score-yellow', 'score-green')

  // Add the right color based on score
  let band = document.getElementById('score-band')

  if (total <= 39) {
    circle.classList.add('score-red')
    band.textContent = '🔴 Critical Risk'
    band.style.color = '#e53e3e'
  } else if (total <= 59) {
    circle.classList.add('score-orange')
    band.textContent = '🟠 Needs Attention'
    band.style.color = '#dd6b20'
  } else if (total <= 79) {
    circle.classList.add('score-yellow')
    band.textContent = '🟡 Moderate'
    band.style.color = '#d69e2e'
  } else {
    circle.classList.add('score-green')
    band.textContent = '🟢 You are Safe!'
    band.style.color = '#38a169'
  }

  // Update each module card
  document.getElementById('mod-password').textContent = scores.password + ' / 25'
  document.getElementById('mod-breach').textContent   = scores.breach   + ' / 25'
  document.getElementById('mod-quiz').textContent     = scores.quiz     + ' / 20'
  document.getElementById('mod-twofa').textContent    = scores.twofa    + ' / 30'
}

// ---- PASSWORD CHECKER ----
// Runs every time user types in password field
function checkPassword() {
  let password = document.getElementById('password-input').value
  let fill     = document.getElementById('strength-fill')
  let label    = document.getElementById('strength-label')

  // If password is empty, reset
  if (password.length === 0) {
    fill.style.width      = '0%'
    fill.style.background = '#e2e8f0'
    label.textContent     = 'Enter a password'
    scores.password       = 0
    updateScoreDisplay()
    return
  }

  // Use zxcvbn library to check strength (score is 0 to 4)
  let result = zxcvbn(password)
  let level  = result.score  // 0 = very weak, 4 = very strong

  // Map strength level to width, color, label, and points
  let strengthMap = {
    0: { width: '20%', color: '#e53e3e', text: 'Very Weak',  pts: 0  },
    1: { width: '40%', color: '#dd6b20', text: 'Weak',       pts: 6  },
    2: { width: '60%', color: '#d69e2e', text: 'Fair',       pts: 12 },
    3: { width: '80%', color: '#3182ce', text: 'Good',       pts: 18 },
    4: { width: '100%',color: '#38a169', text: 'Very Strong',pts: 25 }
  }

  let s = strengthMap[level]

  // Update the strength bar
  fill.style.width      = s.width
  fill.style.background = s.color

  // Update the label
  label.textContent     = s.text
  label.style.color     = s.color

  // Save score and update display
  scores.password = s.pts
  updateScoreDisplay()
}

// ---- BUTTON CLICK ----
// When user clicks "Check My Score"
document.getElementById('check-btn').addEventListener('click', function() {
  let email = document.getElementById('email-input').value

  // Validate email
  if (email.trim() === '') {
    alert('Please enter your email first!')
    return
  }

  // Run breach check (we will build this on Day 3)
  // For now just show a placeholder
  let breachBox = document.getElementById('breach-result')
  breachBox.style.display = 'block'
  document.getElementById('breach-text').textContent = '🔍 Breach check coming on Day 3!'

  // Show quiz section
  document.getElementById('quiz-section').style.display = 'block'
  startQuiz()
})

// ---- ATTACH PASSWORD LISTENER ----
// Every keypress in password field runs checkPassword()
document.getElementById('password-input').addEventListener('input', checkPassword)