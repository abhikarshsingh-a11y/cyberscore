// ════════════════════════════════════════════
// SCORE STATE — shared memory for all modules
// ════════════════════════════════════════════
let scores = {
  password: 0,
  breach:   0,
  quiz:     0,
  twofa:    0
}

// ════════════════════════════════════════════
// UPDATE SCORE DISPLAY
// Called after EVERY module updates its score
// ════════════════════════════════════════════
function updateScoreDisplay() {
  let total = scores.password + scores.breach + scores.quiz + scores.twofa

  // Update the big number
  document.getElementById('score-number').textContent = total

  // Remove all colour classes first
  let circle = document.getElementById('score-circle')
  circle.classList.remove('score-red', 'score-orange', 'score-yellow', 'score-green')

  // Add correct colour + band label
  let band = document.getElementById('score-band')

  if (total <= 39) {
    circle.classList.add('score-red')
    band.textContent  = '🔴 Critical Risk'
    band.style.color  = '#e53e3e'
  } else if (total <= 59) {
    circle.classList.add('score-orange')
    band.textContent  = '🟠 Needs Attention'
    band.style.color  = '#dd6b20'
  } else if (total <= 79) {
    circle.classList.add('score-yellow')
    band.textContent  = '🟡 Moderate'
    band.style.color  = '#d69e2e'
  } else {
    circle.classList.add('score-green')
    band.textContent  = '🟢 You are Safe!'
    band.style.color  = '#38a169'
  }

  // Update each module card
  document.getElementById('mod-password').textContent = scores.password + ' / 25'
  document.getElementById('mod-breach').textContent   = scores.breach   + ' / 25'
  document.getElementById('mod-quiz').textContent     = scores.quiz     + ' / 20'
  document.getElementById('mod-twofa').textContent    = scores.twofa    + ' / 30'
}

// ════════════════════════════════════════════
// PASSWORD CHECKER
// Runs on every keypress in password field
// ════════════════════════════════════════════
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

  let s             = strengthMap[level]
  fill.style.width      = s.width
  fill.style.background = s.color
  label.textContent     = s.text
  label.style.color     = s.color
  scores.password       = s.pts
  updateScoreDisplay()
}

// ════════════════════════════════════════════
// SHA1 HASH FUNCTION
// Converts email into a hash
// Only first 5 chars are sent to the API
// Your real email NEVER leaves your device
// ════════════════════════════════════════════
async function sha1(str) {
  // Step 1 — convert text to bytes
  let buffer = new TextEncoder().encode(str)

  // Step 2 — browser creates SHA1 hash from bytes
  let hashBuffer = await crypto.subtle.digest('SHA-1', buffer)

  // Step 3 — convert bytes to readable hex string
  let hashArray = Array.from(new Uint8Array(hashBuffer))
  let hashHex   = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Step 4 — return UPPERCASE version
  return hashHex.toUpperCase()
}

// ════════════════════════════════════════════
// EMAIL BREACH CHECKER
// Calls HaveIBeenPwned API safely
// ════════════════════════════════════════════
async function checkBreach(email) {
  let breachBox  = document.getElementById('breach-result')
  let breachText = document.getElementById('breach-text')

  // Show box with loading message
  breachBox.style.display    = 'block'
  breachBox.style.background = '#ebf8ff'
  breachBox.style.border     = '1.5px solid #90cdf4'
  breachText.textContent     = '🔍 Checking your email for breaches...'

  try {
    // STEP 1 — hash the email
    // Always lowercase + trimmed so same email gives same hash
    let hash = await sha1(email.toLowerCase().trim())

    // STEP 2 — split hash into prefix (first 5) and suffix (rest)
    // We only SEND the prefix — never the full hash
    let prefix = hash.substring(0, 5)   // e.g. "A94A8"
    let suffix = hash.substring(5)      // e.g. "FE5CCB19BA61C4C0873D391E987982FBBD3"

    // STEP 3 — call the API with just the prefix
    let response = await fetch('https://api.pwnedpasswords.com/range/' + prefix)

    // STEP 4 — if API fails throw an error to catch block
    if (!response.ok) {
      throw new Error('API failed with status: ' + response.status)
    }

    // STEP 5 — get the response text
    // API returns hundreds of lines like: "SUFFIX:COUNT"
    let text  = await response.text()
    let lines = text.split('\n')

    // STEP 6 — search through lines to find our suffix
    let breachCount = 0
    for (let line of lines) {
      let parts          = line.split(':')
      let returnedSuffix = parts[0].replace(/\r/g, '').trim()
      let count          = parseInt(parts[1])

      // If suffix matches — this email was in a breach!
      if (returnedSuffix === suffix) {
        breachCount = count
        break   // found it — stop searching
      }
    }

    // STEP 7 — show result based on breach count
    if (breachCount === 0) {
      breachBox.style.background = '#c6f6d5'
      breachBox.style.border     = '1.5px solid #38a169'
      breachText.textContent     = '✅ Great news! No breaches found for this email.'
      scores.breach              = 25

    } else if (breachCount <= 2) {
      breachBox.style.background = '#fefcbf'
      breachBox.style.border     = '1.5px solid #d69e2e'
      breachText.textContent     = '⚠️ Found in ' + breachCount + ' breach(es). Change passwords on affected sites!'
      scores.breach              = 10

    } else {
      breachBox.style.background = '#fed7d7'
      breachBox.style.border     = '1.5px solid #e53e3e'
      breachText.textContent     = '🚨 Found in ' + breachCount.toLocaleString() + ' breaches! Change your passwords immediately.'
      scores.breach              = 0
    }

  } catch (error) {
    // If ANYTHING goes wrong — show friendly message, never crash
    breachBox.style.background = '#fff5f5'
    breachBox.style.border     = '1.5px solid #fc8181'
    breachText.textContent     = '⚠️ Could not check right now. Please check your internet and try again.'
    scores.breach              = 0

    // Log real error to console for debugging
    console.log('Breach check error:', error.message)
  }

  // Always update score after breach check finishes
  updateScoreDisplay()
}

// ════════════════════════════════════════════
// BUTTON CLICK — main trigger
// ════════════════════════════════════════════
document.getElementById('check-btn').addEventListener('click', async function () {

  let email = document.getElementById('email-input').value.trim()

  // Validation 1 — empty field
  if (email === '') {
    alert('❌ Please enter your email address first!')
    return
  }

  // Validation 2 — not a real email
  if (!email.includes('@') || !email.includes('.')) {
    alert('❌ Please enter a valid email address (must have @ and .)')
    return
  }

  // Disable button while checking — stops double clicks
  let btn      = document.getElementById('check-btn')
  btn.disabled = true
  btn.textContent = '⏳ Checking...'

  // Run breach check — await means wait for it to finish
  await checkBreach(email)

  // Re-enable button after check
  btn.disabled    = false
  btn.textContent = 'Check My Score'

  // Show quiz section
  document.getElementById('quiz-section').style.display = 'block'
  startQuiz()
})

// ════════════════════════════════════════════
// PASSWORD FIELD LISTENER
// ════════════════════════════════════════════
document.getElementById('password-input').addEventListener('input', checkPassword)