"use client"

import { useState, useEffect } from "react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi"
import { encodeAbiParameters } from "viem"
import { powersAbi } from "@/context/abi"
import { getConstants } from "@/context/constants"
import { FingerPrintIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

const TARGET_CHAIN_ID = 11155111 // Sepolia

type Props = {
  preselectedIndex?: number
}

export function SignupForm({ preselectedIndex }: Props) {
  const { ready, authenticated, login, logout } = usePrivy()
  const { ready: walletsReady, wallets } = useWallets()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const constants = getConstants(TARGET_CHAIN_ID)
  const csAddress = constants.CULTURAL_STEWARDSHIP
  const signupMandateId = constants.CULTURAL_STEWARDSHIP_SIGNUP_MANDATE ?? 0

  const connectedAddress = walletsReady && wallets[0] ? wallets[0].address as `0x${string}` : undefined

  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined)
  const [applicantUri, setApplicantUri] = useState("")

  const { data: orgData } = useReadContracts({
    contracts: [
      {
        address: csAddress,
        abi: powersAbi,
        functionName: "name",
        chainId: TARGET_CHAIN_ID,
      },
      {
        address: csAddress,
        abi: powersAbi,
        functionName: "getAmountRoleHolders",
        args: [4n],
        chainId: TARGET_CHAIN_ID,
      },
    ],
    query: { enabled: !!csAddress && csAddress !== "0x0000000000000000000000000000000000000000" },
  })

  const orgName = orgData?.[0]?.status === "success" ? (orgData[0].result as string) : undefined
  const holderCount = orgData?.[1]?.status === "success" ? Number(orgData[1].result as bigint) : 0

  const holderIndices = Array.from({ length: holderCount }, (_, i) => BigInt(i))

  const { data: holderAddressData } = useReadContracts({
    contracts: holderIndices.map((i) => ({
      address: csAddress!,
      abi: powersAbi,
      functionName: "getRoleHolderAtIndex" as const,
      args: [4n, i] as [bigint, bigint],
      chainId: TARGET_CHAIN_ID,
    })),
    query: { enabled: holderCount > 0 && !!csAddress },
  })

  const holderAddresses: `0x${string}`[] = (holderAddressData ?? [])
    .filter((r) => r.status === "success")
    .map((r) => r.result as `0x${string}`)

  const { data: holderNameData } = useReadContracts({
    contracts: holderAddresses.map((addr) => ({
      address: addr,
      abi: powersAbi,
      functionName: "name" as const,
      chainId: TARGET_CHAIN_ID,
    })),
    query: { enabled: holderAddresses.length > 0 },
  })

  const holderNames: string[] = (holderNameData ?? [])
    .map((r, i) => (r.status === "success" ? (r.result as string) : `Organisation ${i}`))

  useEffect(() => {
    if (preselectedIndex !== undefined && holderNames.length > 0) {
      if (preselectedIndex < holderNames.length) {
        setSelectedIndex(preselectedIndex)
      }
    }
  }, [preselectedIndex, holderNames.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!connectedAddress || selectedIndex === undefined) return

    const targetAddress = holderAddresses[selectedIndex]
    if (!targetAddress) return

    const calldata = encodeAbiParameters(
      [{ name: "Applicant", type: "address" }, { name: "ApplicantUri", type: "string" }],
      [connectedAddress, applicantUri]
    )

    const nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))

    writeContract({
      address: targetAddress,
      abi: powersAbi,
      functionName: "request",
      args: [signupMandateId, calldata, nonce, "signup from form"],
      chainId: TARGET_CHAIN_ID,
    })
  }

  const isSignedIn = ready && authenticated && walletsReady && !!wallets[0]
  const canSubmit = isSignedIn && selectedIndex !== undefined && !isPending && !isConfirming
  const isWrongChain = chainId !== TARGET_CHAIN_ID && isSignedIn

  console.log({ isSignedIn, canSubmit, isWrongChain, holderAddresses })

  return (
    <div style={{ fontFamily: "'Times New Roman', Times, serif" }} className="space-y-10 max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-4xl font-bold tracking-tight">FORM</h1>
      <form onSubmit={handleSubmit} className="space-y-6 text-left" noValidate>

        <div className="space-y-2">
          <label htmlFor="organisation" className="block text-base font-bold">
            Chosen Ideas Layer:
          </label>
          {holderNames.length === 0 ? (
            <div className="w-full border-2 border-foreground bg-background px-4 py-2 text-base text-foreground/50">
              Loading layers...
            </div>
          ) : (
            <select
              id="organisation"
              value={selectedIndex ?? ""}
              onChange={(e) => {
                resetWrite()
                setSelectedIndex(e.target.value === "" ? undefined : Number(e.target.value))
              }}
              className="w-full border-2 border-foreground bg-background px-4 py-2 text-base"
            >
              <option value="">— Select a layer —</option>
              {holderNames.map((name, i) => (
                <option key={holderAddresses[i]} value={i}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="applicantUri" className="block text-base font-bold">
            Reason for joining?
          </label>
          <textarea
            id="applicantUri"
            value={applicantUri}
            onChange={(e) => { resetWrite(); setApplicantUri(e.target.value) }}
            placeholder="e.g. https://your-profile-url.com or ipfs://…"
            rows={3}
            className="w-full border-2 border-foreground bg-background px-4 py-2 text-base"
          />
          <p className="text-sm text-foreground/60">A URI pointing to your applicant profile or supporting information.</p>
        </div>

        <div className="space-y-2">
          <label className="block text-base font-bold">
            Connected Account:
          </label>
          <div className="flex items-center gap-3">
            <p className="flex-1 text-base font-mono truncate text-foreground/70">
              {connectedAddress ?? <span className="text-foreground/40">Not connected</span>}
            </p>
            {ready ? (
              <button
                type="button"
                onClick={isSignedIn ? logout : login}
                className="flex items-center gap-1.5 bg-foreground text-background border-2 border-foreground px-4 py-2 text-sm tracking-wider hover:opacity-80 transition-colors whitespace-nowrap"
              >
                {isSignedIn ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4" />
                    Sign out
                  </>
                ) : (
                  <>
                    <FingerPrintIcon className="h-4 w-4" />
                    Sign in
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center px-4 py-2 border-2 border-foreground text-sm text-foreground/40">
                Loading…
              </div>
            )}
          </div>
        </div>

        {isWrongChain && (
          <p className="text-sm text-destructive">
            Please switch to Sepolia to submit.{" "}
            <button
              type="button"
              onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
              className="underline"
            >
              Switch network
            </button>
          </p>
        )}
        {isPending && (
          <p className="text-sm text-foreground">Confirm the transaction in your wallet…</p>
        )}
        {isConfirming && (
          <p className="text-sm text-foreground">Transaction submitted, waiting for confirmation…</p>
        )}
        {isConfirmed && (
          <p className="text-sm text-green-700">Application submitted successfully!</p>
        )}
        {writeError && (
          <p className="text-sm text-destructive">Transaction failed: {writeError.message}</p>
        )}

        <div className="flex flex-col items-center space-y-4">
          <p className="text-base text-foreground text-center">
            Note: Applications will be reviewed by existing member organisations. Once accepted, you will automatically be assigned a membership role. Sign in with the same address to access your organisation&apos;s governance.
          </p>
          <button
            type="submit"
            disabled={!canSubmit || isWrongChain}
            className="bg-foreground text-background border-2 border-foreground px-6 py-3 text-sm tracking-wider hover:opacity-80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {!isSignedIn
              ? "→ SIGN IN TO APPLY"
              : selectedIndex === undefined
                ? "→ SUBMIT APPLICATION"
                : isPending || isConfirming
                  ? "→ SUBMITTING…"
                  : "→ SUBMIT"}
          </button>
        </div>

      </form>
    </div>
  )
}
