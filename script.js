// ════════════════════════════════════════════
// SCORE STATE — 5 modules, 20 pts each
// ════════════════════════════════════════════
let scores = {
  password:     0,   // password strength     — max 20
  pwdbreach:    0,   // password breach check — max 20
  emailbreach:  0,   // email breach check    — max 20
  quiz:         0,   // awareness quiz        — max 20
  twofa:        0    // 2FA checklist         — max 20
}

// ════════════════════════════════════════════
// UPDATE SCORE DISPLAY
// ════════════════════════════════════════════
function updateScoreDisplay() {
  let total = scores.password + scores.pwdbreach + scores.emailbreach + scores.quiz + scores.twofa

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

  // Update all 5 module cards
  document.getElementById('mod-password').textContent    = scores.password    + ' / 20'
  document.getElementById('mod-pwdbreach').textContent   = scores.pwdbreach   + ' / 20'
  document.getElementById('mod-emailbreach').textContent = scores.emailbreach + ' / 20'
  document.getElementById('mod-quiz').textContent        = scores.quiz        + ' / 20'
  document.getElementById('mod-twofa').textContent       = scores.twofa       + ' / 20'
}

// ════════════════════════════════════════════
// PASSWORD STRENGTH CHECKER
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
    1: { width: '40%',  color: '#dd6b20', text: 'Weak',        pts: 5  },
    2: { width: '60%',  color: '#d69e2e', text: 'Fair',        pts: 10 },
    3: { width: '80%',  color: '#3182ce', text: 'Good',        pts: 15 },
    4: { width: '100%', color: '#38a169', text: 'Very Strong', pts: 20 }
  }

  let s                 = strengthMap[level]
  fill.style.width      = s.width
  fill.style.background = s.color
  label.textContent     = s.text
  label.style.color     = s.color
  scores.password       = s.pts
  updateScoreDisplay()
}

// ════════════════════════════════════════════
// SHA1 HASH — for password breach check
// ════════════════════════════════════════════
async function sha1(str) {
  let buffer     = new TextEncoder().encode(str)
  let hashBuffer = await crypto.subtle.digest('SHA-1', buffer)
  let hashArray  = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

// ════════════════════════════════════════════
// PASSWORD BREACH CHECK
// Uses HaveIBeenPwned password range API
// k-anonymity — password never leaves device
// ════════════════════════════════════════════
async function checkPasswordBreach(password) {
  let resultBox = document.getElementById('password-breach-result')

  // Don't check empty passwords
  if (!password || password.length === 0) {
    resultBox.style.display = 'none'
    scores.pwdbreach        = 0
    updateScoreDisplay()
    return
  }

  try {
    let hash   = await sha1(password)
    let prefix = hash.substring(0, 5)
    let suffix = hash.substring(5)

    let response = await fetch('https://api.pwnedpasswords.com/range/' + prefix)
    let text     = await response.text()
    let lines    = text.split('\n')

    let breachCount = 0
    for (let line of lines) {
      let parts          = line.split(':')
      // ✅ Remove hidden \r character
      let returnedSuffix = parts[0].replace(/\r/g, '').trim()
      let count          = parseInt(parts[1])

      if (returnedSuffix === suffix) {
        breachCount = count
        break
      }
    }

    resultBox.style.display = 'block'

    if (breachCount === 0) {
      resultBox.style.background = '#c6f6d5'
      resultBox.style.border     = '1px solid #38a169'
      resultBox.textContent      = '✅ This password has never been seen in any breach!'
      scores.pwdbreach           = 20
    } else {
      resultBox.style.background = '#fed7d7'
      resultBox.style.border     = '1px solid #e53e3e'
      resultBox.textContent      = '🚨 This password appeared in ' + breachCount.toLocaleString() + ' breaches! Change it immediately.'
      scores.pwdbreach           = 0
    }

  } catch (error) {
    resultBox.style.display    = 'block'
    resultBox.style.background = '#fff5f5'
    resultBox.style.border     = '1px solid #fc8181'
    resultBox.textContent      = '⚠️ Could not check password breach. Try again.'
    scores.pwdbreach           = 0
    console.log('Password breach error:', error.message)
  }

  updateScoreDisplay()
}

// ════════════════════════════════════════════
// EMAIL BREACH CHECK
// Uses XposedOrNot API — 100% free, no key!
// Checks if email appeared in known breaches
// ════════════════════════════════════════════
async function checkEmailBreach(email) {
  let resultBox = document.getElementById('email-breach-result')

  resultBox.style.display    = 'block'
  resultBox.style.background = '#ebf8ff'
  resultBox.style.border     = '1px solid #90cdf4'
  resultBox.textContent      = '🔍 Checking email for breaches...'

  try {
    // Clean email — remove any hidden characters
    let cleanEmail = email.replace(/[^\w@.\-+]/g, '').toLowerCase().trim()

    let response = await fetch(
      'https://api.xposedornot.com/v1/check-email/' + cleanEmail,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    // 404 means email not found in any breach — that is GOOD
    if (response.status === 404) {
      resultBox.style.background = '#c6f6d5'
      resultBox.style.border     = '1px solid #38a169'
      resultBox.textContent      = '✅ Great news! Your email was not found in any known breach.'
      scores.emailbreach         = 20
      updateScoreDisplay()
      return
    }

    if (!response.ok) {
      throw new Error('API error: ' + response.status)
    }

    let data = await response.json()

    // API returns breaches array if email was found
    if (data && data.breaches && data.breaches.length > 0) {
      let count = data.breaches.length
      resultBox.style.background = '#fed7d7'
      resultBox.style.border     = '1px solid #e53e3e'
      resultBox.textContent      = '🚨 Your email was found in ' + count + ' breach(es)! Check and change your passwords.'
      scores.emailbreach         = 0

    } else if (data && data.ExposedBreaches) {
      // Some versions return ExposedBreaches object
      let count = data.ExposedBreaches.breaches_details
        ? data.ExposedBreaches.breaches_details.length
        : 0

      if (count > 0) {
        resultBox.style.background = '#fed7d7'
        resultBox.style.border     = '1px solid #e53e3e'
        resultBox.textContent      = '🚨 Your email was found in ' + count + ' breach(es)! Change your passwords.'
        scores.emailbreach         = 0
      } else {
        resultBox.style.background = '#c6f6d5'
        resultBox.style.border     = '1px solid #38a169'
        resultBox.textContent      = '✅ Great news! Your email was not found in any known breach.'
        scores.emailbreach         = 20
      }

    } else {
      // No breaches found
      resultBox.style.background = '#c6f6d5'
      resultBox.style.border     = '1px solid #38a169'
      resultBox.textContent      = '✅ Great news! Your email was not found in any known breach.'
      scores.emailbreach         = 20
    }

  } catch (error) {
    resultBox.style.background = '#fff5f5'
    resultBox.style.border     = '1px solid #fc8181'
    resultBox.textContent      = '⚠️ Could not check email breach right now. Try again.'
    scores.emailbreach         = 0
    console.log('Email breach error:', error.message)
  }

  updateScoreDisplay()
}

// ════════════════════════════════════════════
// BUTTON CLICK — runs all checks together
// ════════════════════════════════════════════
document.getElementById('check-btn').addEventListener('click', async function () {

  let email    = document.getElementById('email-input').value.trim()
  let password = document.getElementById('password-input').value

  // Validate email
  if (email === '') {
    alert('❌ Please enter your email address!')
    return
  }
  if (!email.includes('@') || !email.includes('.')) {
    alert('❌ Please enter a valid email address!')
    return
  }

  // Validate password
  if (password === '') {
    alert('❌ Please enter a password to test!')
    return
  }

  // Disable button while checking
  let btn         = document.getElementById('check-btn')
  btn.disabled    = true
  btn.textContent = '⏳ Checking...'

  // Run BOTH breach checks at the same time — faster!
  await Promise.all([
    checkEmailBreach(email),
    checkPasswordBreach(password)
  ])

  // Re-enable button
  btn.disabled    = false
  btn.textContent = 'Check My Score'

  // Show quiz
  document.getElementById('quiz-section').style.display = 'block'
  startQuiz()
})

// ════════════════════════════════════════════
// PASSWORD FIELD LISTENER
// ════════════════════════════════════════════
document.getElementById('password-input').addEventListener('input', checkPassword)

// ════════════════════════════════════════════
// 2FA CHECKLIST LOGIC
// Each checkbox = 4 pts, 5 checkboxes = 20 pts max
// ════════════════════════════════════════════
function setup2FAChecklist() {
  let checkboxes = document.querySelectorAll('.twofa-check')

  checkboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
      calculate2FAScore()
    })
  })
}

function calculate2FAScore() {
  let checkboxes = document.querySelectorAll('.twofa-check')
  let total      = 0
  let checked    = 0

  checkboxes.forEach(function(checkbox) {
    if (checkbox.checked) {
      let pts = parseInt(checkbox.getAttribute('data-pts'))
      total   = total + pts
      checked = checked + 1
    }
  })

  // Cap at 20
  scores.twofa = Math.min(total, 20)

  // Update label
  let label         = document.getElementById('twofa-score-label')
  label.textContent = checked + ' / 5 apps protected'

  if (checked === 5) {
    label.style.color = '#38a169'
  } else if (checked >= 3) {
    label.style.color = '#d69e2e'
  } else {
    label.style.color = '#e53e3e'
  }

  updateScoreDisplay()
}

// Run setup when page loads
setup2FAChecklist()

// ════════════════════════════════════════════
// SCORE COUNT-UP ANIMATION
// Smoothly counts from 0 to final score
// ════════════════════════════════════════════
function animateScore(targetScore) {
  let current   = 0
  let scoreEl   = document.getElementById('score-number')
  let duration  = 1500   // total animation time in milliseconds
  let increment = targetScore / (duration / 16)  // how much to add each frame

  // Clear any previous animation
  if (window.scoreAnimationId) {
    clearInterval(window.scoreAnimationId)
  }

  window.scoreAnimationId = setInterval(function() {
    current = current + increment

    if (current >= targetScore) {
      current = targetScore
      clearInterval(window.scoreAnimationId)
    }

    scoreEl.textContent = Math.floor(current)
  }, 16)  // runs every 16ms = 60fps
}

// ════════════════════════════════════════════
// BADGE SYSTEM
// Shows a badge based on final score
// ════════════════════════════════════════════
function showBadge(score) {
  let badgeEl = document.getElementById('score-badge')
  if (!badgeEl) return

  let badge = {}

  if (score >= 90) {
    badge = { icon: '🏆', title: 'Cyber Guardian', color: '#38a169' }
  } else if (score >= 75) {
    badge = { icon: '🛡️', title: 'Privacy Pro', color: '#3182ce' }
  } else if (score >= 60) {
    badge = { icon: '🔒', title: 'Security Aware', color: '#d69e2e' }
  } else if (score >= 40) {
    badge = { icon: '⚠️', title: 'Needs Improvement', color: '#dd6b20' }
  } else {
    badge = { icon: '🚨', title: 'At Risk', color: '#e53e3e' }
  }

  badgeEl.style.display  = 'block'
  badgeEl.style.color    = badge.color
  badgeEl.style.border   = '2px solid ' + badge.color
  badgeEl.innerHTML      = badge.icon + ' ' + badge.title
}

// ════════════════════════════════════════════
// FIX-IT CARDS
// Shows personalized advice based on weak scores
// ════════════════════════════════════════════
function showFixItCards() {
  let container = document.getElementById('fixit-cards')
  let section   = document.getElementById('fixit-section')

  if (!container || !section) return

  // Clear old cards
  container.innerHTML = ''

  let cards = []

  // Check each module and add fix-it card if score is low

  if (scores.password < 15) {
    cards.push({
      icon:  '🔑',
      title: 'Strengthen Your Password',
      color: '#e53e3e',
      tips: [
        'Use at least 12 characters',
        'Mix uppercase, lowercase, numbers and symbols',
        'Avoid using your name or birthday',
        'Try a passphrase like: Blue!Mango#River9'
      ]
    })
  }

  if (scores.pwdbreach === 0) {
    cards.push({
      icon:  '🔓',
      title: 'Your Password Was Breached!',
      color: '#e53e3e',
      tips: [
        'Change this password immediately',
        'Never reuse this password on any site',
        'Use a password manager like Bitwarden (free)',
        'Enable 2FA on all accounts that used this password'
      ]
    })
  }

  if (scores.emailbreach === 0) {
    cards.push({
      icon:  '📧',
      title: 'Your Email Was Found in a Breach!',
      color: '#e53e3e',
      tips: [
        'Change passwords on all important accounts',
        'Check which sites were breached at haveibeenpwned.com',
        'Enable 2FA on your email account immediately',
        'Watch out for phishing emails using your data'
      ]
    })
  }

  if (scores.quiz < 14) {
    cards.push({
      icon:  '🧠',
      title: 'Improve Your Cyber Awareness',
      color: '#d69e2e',
      tips: [
        'Never share OTPs with anyone — banks never ask',
        'Always verify before clicking links in WhatsApp',
        'Avoid banking on public WiFi networks',
        'Visit cybercrime.gov.in to learn more'
      ]
    })
  }

  if (scores.twofa < 12) {
    cards.push({
      icon:  '🔐',
      title: 'Enable 2FA on More Apps',
      color: '#d69e2e',
      tips: [
        'Enable 2FA on Gmail: Settings → Security → 2-Step Verification',
        'Enable 2FA on Instagram: Settings → Security → Two-Factor Auth',
        'Enable 2FA on WhatsApp: Settings → Account → Two-Step Verification',
        'Use Google Authenticator app for extra security'
      ]
    })
  }

  // If everything is great — show a congratulations card
  if (cards.length === 0) {
    cards.push({
      icon:  '🎉',
      title: 'Excellent! You are well protected!',
      color: '#38a169',
      tips: [
        'Keep updating your passwords every 3-6 months',
        'Stay alert for new phishing techniques',
        'Help your family members improve their cyber safety',
        'Check your score again after any major security news'
      ]
    })
  }

  // Build each card as HTML
  cards.forEach(function(card) {
    let tipsList = card.tips
      .map(function(tip) { return '<li>' + tip + '</li>' })
      .join('')

    let cardHTML = `
      <div class="fixit-card" style="border-left-color: ${card.color}">
        <h3>${card.icon} ${card.title}</h3>
        <ul>${tipsList}</ul>
      </div>
    `

    container.innerHTML = container.innerHTML + cardHTML
  })

  // Show the section
  section.style.display = 'block'
}

// ════════════════════════════════════════════
// UPDATED updateScoreDisplay
// Now includes animation + badge + fix-it cards
// REPLACE your old updateScoreDisplay function with this
// ════════════════════════════════════════════
function updateScoreDisplay() {
  let total = scores.password + scores.pwdbreach + scores.emailbreach + scores.quiz + scores.twofa

  // Animate the score number
  animateScore(total)

  // Remove all colour classes
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

  // Update all 5 module cards
  document.getElementById('mod-password').textContent    = scores.password    + ' / 20'
  document.getElementById('mod-pwdbreach').textContent   = scores.pwdbreach   + ' / 20'
  document.getElementById('mod-emailbreach').textContent = scores.emailbreach + ' / 20'
  document.getElementById('mod-quiz').textContent        = scores.quiz        + ' / 20'
  document.getElementById('mod-twofa').textContent       = scores.twofa       + ' / 20'

  // Show badge
  showBadge(total)

  // Show fix-it cards only after all modules are done
  let allDone = (scores.quiz > 0 || scores.twofa > 0)
  if (allDone) {
    showFixItCards()
  }
}