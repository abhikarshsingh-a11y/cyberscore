// ---- SCORE STATE ----
let scores = {
  password: 0,
  breach:   0,
  quiz:     0,
  twofa:    0
}

// ---- UPDATE SCORE DISPLAY ----
function updateScoreDisplay() {
  let total = scores.password + scores.breach + scores.quiz + scores.twofa
  document.getElementById('score-number').textContent = total

  let circle = document.getElementById('score-circle')
  circle.classList.remove('score-red', 'score-orange', 'score-yellow', 'score-green')

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

  document.getElementById('mod-password').textContent = scores.password + ' / 25'
  document.getElementById('mod-breach').textContent   = scores.breach   + ' / 25'
  document.getElementById('mod-quiz').textContent     = scores.quiz     + ' / 20'
  document.getElementById('mod-twofa').textContent    = scores.twofa    + ' / 30'
}

// ---- PASSWORD CHECKER ----
function checkPassword() {
  let password = document.getElementById('password-input').value
  let fill     = document.getElementById('strength-fill')
  let label    = document.getElementById('strength-label')

  if (password.length === 0) {
    fill.style.width      = '0%'
    fill.style.background = '#e2e8f0'
    label.textContent     = 'Enter a password'
    scores.password       = 0
    updateScoreDisplay()
    return
  }

  let result = zxcvbn(password)
  let level  = result.score

  let strengthMap = {
    0: { width: '20%',  color: '#e53e3e', text: 'Very Weak',   pts: 0  },
    1: { width: '40%',  color: '#dd6b20', text: 'Weak',        pts: 6  },
    2: { width: '60%',  color: '#d69e2e', text: 'Fair',        pts: 12 },
    3: { width: '80%',  color: '#3182ce', text: 'Good',        pts: 18 },
    4: { width: '100%', color: '#38a169', text: 'Very Strong', pts: 25 }
  }

  let s = strengthMap[level]
  fill.style.width      = s.width
  fill.style.background = s.color
  label.textContent     = s.text
  label.style.color     = s.color
  scores.password       = s.pts
  updateScoreDisplay()
}

// ---- SHA1 HASH FUNCTION ----
// This converts your email to a hash
// Only the first 5 characters are sent to the API — your real email NEVER leaves your device
async function sha1(str) {
  // Convert the string to bytes
  let buffer = new TextEncoder().encode(str)

  // Use browser's built-in crypto to create SHA1 hash
  let hashBuffer = await crypto.subtle.digest('SHA-1', buffer)

  // Convert hash bytes to a readable hex string
  let hashArray = Array.from(new Uint8Array(hashBuffer))
  let hashHex   = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Return uppercase version
  return hashHex.toUpperCase()
}

// ---- EMAIL BREACH CHECKER ----
async function checkBreach(email) {
  let breachBox  = document.getElementById('breach-result')
  let breachText = document.getElementById('breach-text')

  // Show the result box and a loading message
  breachBox.style.display = 'block'
  breachBox.style.background = '#ebf8ff'
  breachBox.style.borderColor = '#90cdf4'
  breachText.textContent = '🔍 Checking for breaches...'

  try {
    // Step 1: hash the email
    let hash = await sha1(email.toLowerCase().trim())

    // Step 2: send only the first 5 characters to the API
    // This is called k-anonymity — your full email is never sent
    let prefix   = hash.substring(0, 5)
    let suffix   = hash.substring(5)

    // Step 3: call the HaveIBeenPwned API
    let response = await fetch('https://api.pwnedpasswords.com/range/' + prefix)

    if (!response.ok) {
      throw new Error('API call failed')
    }

    // Step 4: get the list of matching hashes back
    let text  = await response.text()
    let lines = text.split('\n')

    // Step 5: check if our hash suffix is in the returned list
    let breachCount = 0
    for (let line of lines) {
      let parts       = line.split(':')
      let returnedSuffix = parts[0].trim()
      let count          = parseInt(parts[1])

      // If the suffix matches, this email was breached!
      if (returnedSuffix === suffix) {
        breachCount = count
        break
      }
    }

    // Step 6: show result and update score
    if (breachCount === 0) {
      // Great — no breaches found
      breachBox.style.background  = '#c6f6d5'
      breachBox.style.borderColor = '#38a169'
      breachText.textContent      = '✅ Great news! No breaches found for this email.'
      scores.breach               = 25

    } else if (breachCount <= 2) {
      // A couple of breaches — moderate risk
      breachBox.style.background  = '#fefcbf'
      breachBox.style.borderColor = '#d69e2e'
      breachText.textContent      = '⚠️ Found in ' + breachCount + ' breach(es). Change passwords on affected sites!'
      scores.breach               = 10

    } else {
      // Many breaches — high risk
      breachBox.style.background  = '#fed7d7'
      breachBox.style.borderColor = '#e53e3e'
      breachText.textContent      = '🚨 Found in ' + breachCount + ' breaches! Change your passwords immediately.'
      scores.breach               = 0
    }

  } catch (error) {
    // If API fails — show friendly message, don't crash
    breachBox.style.background  = '#fff5f5'
    breachBox.style.borderColor = '#fc8181'
    breachText.textContent      = '⚠️ Could not check right now. Please try again in a moment.'
    scores.breach               = 0
  }

  // Always update score after breach check
  updateScoreDisplay()
}

// ---- BUTTON CLICK ----
document.getElementById('check-btn').addEventListener('click', async function() {
  let email = document.getElementById('email-input').value.trim()

  // Validate — stop if email is empty
  if (email === '') {
    alert('Please enter your email address first!')
    return
  }

  // Validate — check it looks like a real email
  if (!email.includes('@') || !email.includes('.')) {
    alert('Please enter a valid email address!')
    return
  }

  // Run the breach check
  await checkBreach(email)

  // Show the quiz after breach check is done
  document.getElementById('quiz-section').style.display = 'block'
  startQuiz()
})

// ---- PASSWORD LISTENER ----
document.getElementById('password-input').addEventListener('input', checkPassword)