/**
 * 8bit-engine Entry Point
 * Launches "8BIT QUEST" - a test game demonstrating the engine
 */

import './style.css'
import { startGame } from './game'

const container = document.querySelector<HTMLDivElement>('#app')!
startGame(container)
