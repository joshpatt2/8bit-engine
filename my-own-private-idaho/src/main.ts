/**
 * My Own Private Idaho - Entry Point
 * An 8-bit journey through Idaho's lonely roads
 */

import './style.css'
import { startGame } from './game'

const container = document.querySelector<HTMLDivElement>('#app')!
startGame(container)
