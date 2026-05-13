import type { Abi } from 'viem'
import PowersJson from './builds/Powers.json'
import MandateJson from './builds/Mandate.json'

export const powersAbi = PowersJson.abi as Abi
export const mandateAbi = MandateJson.abi as Abi
