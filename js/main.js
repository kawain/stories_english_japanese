const counterDisplay = document.getElementById('counter')
const titleDisplay = document.getElementById('titleWord')
const englishDisplay = document.getElementById('englishWord')
const japaneseDisplay = document.getElementById('japaneseWord')

const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const showJapanese = document.getElementById('showJapanese')
const volumeSlider = document.getElementById('volumeSlider')
const volumeValue = document.getElementById('volumeValue')

let count = 0
let timerId = null
let isRunning = false
let volume = 0.5
let wordArray = []
let currentIndex = 0
let isJpanese = true
// Wake Lock 関連の変数・関数
let wakeLock = null

// Wake Lock を要求する関数（ユーザー入力処理内で呼び出す）
async function requestWakeLock () {
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock が解放されました。')
    })
    console.log('Wake Lock が取得されました。')
  } catch (err) {
    console.error(`Wake Lock 取得に失敗しました: ${err.name}, ${err.message}`)
  }
}

function releaseWakeLock () {
  if (wakeLock !== null) {
    wakeLock.release()
    wakeLock = null
  }
}

// ページが再表示されたときに再取得する処理（任意）
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock()
  }
})

// テキストファイルを読み込む関数
async function loadCSV () {
  try {
    const response = await fetch('./data.txt')
    const data = await response.text()
    const rows = data.split('\n')
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].trim() === '') continue
      const parts = rows[i].split('★')
      if (parts.length >= 3) {
        wordArray.push({
          title: parts[0].trim(),
          en: parts[1].trim(),
          jp: parts[2].trim()
        })
      }
    }
    console.log('Loaded words:', wordArray)
  } catch (error) {
    console.error('Error loading File:', error)
  }
}

volumeSlider.addEventListener('input', e => {
  volume = e.target.value / 100
  volumeValue.textContent = `${e.target.value}%`
})

const tts = (text, lang) => {
  return new Promise((resolve, reject) => {
    const uttr = new SpeechSynthesisUtterance()
    uttr.text = text
    uttr.lang = lang
    uttr.rate = 1.0
    uttr.pitch = 1.0
    uttr.volume = volume
    uttr.onend = () => resolve()
    uttr.onerror = error => reject(error)
    speechSynthesis.speak(uttr)
  })
}

const speakWord = async () => {
  try {
    const word = wordArray[currentIndex]

    count++
    counterDisplay.textContent = `${count}回目`

    titleDisplay.textContent = word.title
    englishDisplay.textContent = word.en
    japaneseDisplay.textContent = ''

    await tts(word.en, 'en-US')

    if (isJpanese) {
      japaneseDisplay.textContent = word.jp
      await tts(word.jp, 'ja-JP')
      // await tts(word.en, 'en-US')
    }

    currentIndex++

    if (currentIndex >= wordArray.length) {
      alert('終了しました。')
      currentIndex = 0
      count = 0
      stopStudy()
      releaseWakeLock() // アプリ停止時に Wake Lock を解除する
    }

    if (isRunning) {
      timerId = setTimeout(speakWord, 1000)
    }
  } catch (error) {
    console.error('Speech synthesis error:', error)
  }
}

startBtn.addEventListener('click', async () => {
  if (!isRunning) {
    isRunning = true
    // ユーザーの操作イベント内で Wake Lock を要求する
    await requestWakeLock()
    speakWord()
    startBtn.disabled = true
    stopBtn.disabled = false
  }
})

function stopStudy () {
  clearTimeout(timerId)
  isRunning = false
  startBtn.disabled = false
  stopBtn.disabled = true
  releaseWakeLock() // アプリ停止時に Wake Lock を解除する
  // currentIndex = 0
  // count = 0
}

stopBtn.addEventListener('click', () => {
  stopStudy()
})

stopBtn.disabled = true

showJapanese.addEventListener('change', e => {
  isJpanese = e.target.checked
})

window.addEventListener('DOMContentLoaded', loadCSV)
