"use client"

import { useState, useEffect, useCallback } from "react"
import { api, type ProtocolConfig } from "./api"

export function useProtocols() {
  const [data, setData] = useState<ProtocolConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const refetch = useCallback(() => {
    setLoading(true)
    api.getProtocols()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    refetch()
  }, [refetch])
  return { data, loading, error, refetch }
}

export function useMonitoring(protocolId: string | null) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getMonitoring>> | null>(null)
  const [loading, setLoading] = useState(!!protocolId)
  const [error, setError] = useState<Error | null>(null)
  const refetch = useCallback(() => {
    if (!protocolId) return
    setLoading(true)
    api.getMonitoring(protocolId)
      .then(setData)
      .catch((e) => { setError(e); setData(null); })
      .finally(() => setLoading(false))
  }, [protocolId])
  useEffect(() => {
    if (!protocolId) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    refetch()
  }, [protocolId, refetch])
  return { data, loading, error, refetch }
}

export function useAlerts(protocolId?: string | null) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getAlerts>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const refetch = useCallback(() => {
    setLoading(true)
    api.getAlerts(protocolId ?? undefined)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [protocolId])
  useEffect(() => {
    refetch()
  }, [refetch])
  return { data, loading, error, refetch }
}

export function useRegisterProtocol() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const mutate = useCallback(async (body: Partial<ProtocolConfig>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.registerProtocol(body)
      return result
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
      throw e
    } finally {
      setLoading(false)
    }
  }, [])
  return { mutate, loading, error }
}
