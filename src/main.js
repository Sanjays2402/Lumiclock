import './styles.css'

const app = document.querySelector('.app')
const clock = document.querySelector('.clock')
const hourHand = document.querySelector('.hand-hour')
const minuteHand = document.querySelector('.hand-minute')
const secondHand = document.querySelector('.hand-second')
const clockLabel = document.querySelector('#clockLabel')
const locationLabel = document.querySelector('#locationLabel')

const phases = [
  {
    name: 'midnight',
    start: 0,
    end: 5,
    colors: ['#c2185b', '#6a0572', '#8f00ff', '#371f8b', '#7b2cff', '#b347ff'],
  },
  {
    name: 'dawn',
    start: 5,
    end: 8,
    colors: ['#ffb07c', '#ff7fa2', '#fff5cf', '#ffbf47', '#ffd97b', '#ffd0bc'],
  },
  {
    name: 'midday',
    start: 10,
    end: 15,
    colors: ['#ffd700', '#ff7a00', '#ff4800', '#fff6da', '#ffe14d', '#ff9a00'],
  },
  {
    name: 'sunset',
    start: 17,
    end: 20,
    colors: ['#ff4500', '#ff006e', '#ffd700', '#cc00ff', '#ff8c00', '#ff4fb3'],
  },
  {
    name: 'evening',
    start: 20,
    end: 23,
    colors: ['#ff006e', '#ff4500', '#ffd700', '#cc00ff', '#ff8c00', '#8b00ff'],
  },
]

const transitionAnchors = [
  { hour: 0, colors: ['#c2185b', '#6a0572', '#8f00ff', '#371f8b', '#7b2cff', '#b347ff'], phase: 'midnight' },
  { hour: 5, colors: ['#ffb07c', '#ff7fa2', '#fff5cf', '#ffbf47', '#ffd97b', '#ffd0bc'], phase: 'dawn' },
  { hour: 8, colors: ['#ffb07c', '#ff7fa2', '#fff5cf', '#ffbf47', '#ffd97b', '#ffd0bc'], phase: 'dawn' },
  { hour: 10, colors: ['#ffd700', '#ff7a00', '#ff4800', '#fff6da', '#ffe14d', '#ff9a00'], phase: 'midday' },
  { hour: 15, colors: ['#ffd700', '#ff7a00', '#ff4800', '#fff6da', '#ffe14d', '#ff9a00'], phase: 'midday' },
  { hour: 17, colors: ['#ff4500', '#ff006e', '#ffd700', '#cc00ff', '#ff8c00', '#ff4fb3'], phase: 'sunset' },
  { hour: 20, colors: ['#ff006e', '#ff4500', '#ffd700', '#cc00ff', '#ff8c00', '#8b00ff'], phase: 'evening' },
  { hour: 23, colors: ['#c2185b', '#6a0572', '#8f00ff', '#371f8b', '#7b2cff', '#b347ff'], phase: 'midnight' },
  { hour: 24, colors: ['#c2185b', '#6a0572', '#8f00ff', '#371f8b', '#7b2cff', '#b347ff'], phase: 'midnight' },
]

const gradientStops = [
  { x: '12%', y: '16%', size: '58%' },
  { x: '82%', y: '12%', size: '52%' },
  { x: '18%', y: '82%', size: '55%' },
  { x: '84%', y: '78%', size: '62%' },
  { x: '50%', y: '46%', size: '60%' },
  { x: '52%', y: '96%', size: '54%' },
]

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const bigint = Number.parseInt(normalized, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')}`
}

function mixColor(from, to, amount) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  })
}

function getInterpolatedPalette(hours) {
  const currentHour = hours < 0 ? 0 : hours
  let startAnchor = transitionAnchors[0]
  let endAnchor = transitionAnchors[transitionAnchors.length - 1]

  for (let index = 0; index < transitionAnchors.length - 1; index += 1) {
    const current = transitionAnchors[index]
    const next = transitionAnchors[index + 1]

    if (currentHour >= current.hour && currentHour <= next.hour) {
      startAnchor = current
      endAnchor = next
      break
    }
  }

  const span = Math.max(0.0001, endAnchor.hour - startAnchor.hour)
  const progress = Math.min(1, Math.max(0, (currentHour - startAnchor.hour) / span))

  return {
    phase: progress < 0.5 ? startAnchor.phase : endAnchor.phase,
    colors: startAnchor.colors.map((color, index) => mixColor(color, endAnchor.colors[index], progress)),
  }
}

function setPalette(colors) {
  gradientStops.forEach((stop, index) => {
    const color = colors[index % colors.length]
    app.style.setProperty(`--blob-${index + 1}-color`, color)
    app.style.setProperty(`--blob-${index + 1}-x`, stop.x)
    app.style.setProperty(`--blob-${index + 1}-y`, stop.y)
    app.style.setProperty(`--blob-${index + 1}-size`, stop.size)
  })

  app.style.setProperty('--glow-core', colors[3])
  app.style.setProperty('--glow-warm', colors[0])
  app.style.setProperty('--glow-hot', colors[2])
  app.style.setProperty('--glow-deep', colors[1])
}

function getPhaseName(hour) {
  const match = phases.find((phase) => hour >= phase.start && hour < phase.end)
  return match ? match.name : hour < 10 ? 'dawn' : hour < 17 ? 'midday' : hour < 20 ? 'sunset' : hour < 23 ? 'evening' : 'midnight'
}

function updateClock() {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()
  const milliseconds = now.getMilliseconds()

  const minuteProgress = minutes + (seconds + milliseconds / 1000) / 60
  const hourProgress = (hours % 12) + minuteProgress / 60
  const secondProgress = seconds + milliseconds / 1000

  hourHand.style.transform = `rotate(${hourProgress * 30}deg)`
  minuteHand.style.transform = `rotate(${minuteProgress * 6}deg)`
  secondHand.style.transform = `rotate(${secondProgress * 6}deg)`

  const decimalHour = hours + minuteProgress / 60
  const { phase, colors } = getInterpolatedPalette(decimalHour)
  app.dataset.phase = getPhaseName(hours) || phase
  setPalette(colors)

  const spokenTime = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })

  clock.setAttribute('aria-label', `Local time ${spokenTime}`)
  clockLabel.textContent = `Local time ${spokenTime}`
}

function tick() {
  updateClock()
  window.requestAnimationFrame(tick)
}

function setLocation() {
  const regionNames = new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' })
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'
  const zoneParts = timeZone.split('/')
  const city = zoneParts[zoneParts.length - 1].replace(/_/g, ' ')
  const maybeRegionCode = zoneParts.length > 1 ? zoneParts[0] : ''
  const region = maybeRegionCode.length === 2 ? regionNames.of(maybeRegionCode) : ''
  locationLabel.textContent = region ? `${city} · ${region}` : city
}

setLocation()
updateClock()
window.requestAnimationFrame(tick)