import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './popup.css'

document.title = 'AI Impact Meter'

const descriptionTag = document.querySelector('meta[name="description"]')
if (descriptionTag) {
  descriptionTag.setAttribute(
    'content',
    'AI Impact Meter is a browser extension prototype that estimates electricity and cooling-equivalent water for prompts on major AI sites.',
  )
}

const themeTag = document.querySelector('meta[name="theme-color"]')
if (themeTag) {
  themeTag.setAttribute('content', '#0d0f18')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
