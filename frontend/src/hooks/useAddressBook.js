import { useCallback, useEffect, useRef, useState } from 'react'
import { createAddress, deleteAddress, getAddresses, setDefaultAddress, updateAddress } from '../services/addressApi.js'
import { addressErrorMessage } from '../utils/addressErrors.js'

export default function useAddressBook(ownerId) {
  const [book, setBook] = useState({ items: [], defaultAddressId: null, count: 0 })
  const [loading, setLoading] = useState(Boolean(ownerId))
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [needsReload, setNeedsReload] = useState(false)
  const [pending, setPending] = useState(null)
  const active = useRef(false)
  const loadController = useRef(null)
  const saveController = useRef(null)
  const loadSequence = useRef(0)

  const reload = useCallback(async () => {
    if (!ownerId || !active.current || saveController.current) return
    loadController.current?.abort()
    const controller = new AbortController()
    loadController.current = controller
    const sequence = ++loadSequence.current
    setLoading(true)
    setLoadError('')
    try {
      const { data } = await getAddresses({ signal: controller.signal })
      if (!active.current || controller.signal.aborted || sequence !== loadSequence.current) return
      setBook(data)
      setNeedsReload(false)
    } catch (error) {
      if (!active.current || controller.signal.aborted || sequence !== loadSequence.current) return
      setLoadError(addressErrorMessage(error))
    } finally {
      if (active.current && !controller.signal.aborted && sequence === loadSequence.current) setLoading(false)
    }
  }, [ownerId])

  useEffect(() => {
    active.current = true
    reload()
    return () => {
      active.current = false
      loadController.current?.abort()
      saveController.current?.abort()
    }
  }, [reload])

  const mutateAddress = async (operation, kind, addressId = null) => {
    if (!ownerId || !active.current || saving || loading || loadError || needsReload || saveController.current) {
      throw Object.assign(new Error('Address reload required'), { code: 'ADDRESS_RELOAD_REQUIRED' })
    }
    const controller = new AbortController()
    saveController.current = controller
    ++loadSequence.current
    loadController.current?.abort()
    setSaving(true)
    setPending({ kind, addressId })
    try {
      const { data } = await operation(controller.signal)
      if (!active.current || controller.signal.aborted) return false
      setBook(data)
      return true
    } catch (error) {
      const canceledBeforeSend = error.code === 'ERR_CANCELED' && error.addressRequestStarted === false
      if (active.current && !controller.signal.aborted && !canceledBeforeSend && (!error.response || [404, 409].includes(error.response.status) || error.response.status >= 500)) {
        setNeedsReload(true)
      }
      throw error
    } finally {
      if (saveController.current === controller) saveController.current = null
      if (active.current && !controller.signal.aborted) {
        setSaving(false)
        setPending(null)
      }
    }
  }

  const addAddress = (values) => mutateAddress((signal) => createAddress(values, { signal }), 'create')
  const editAddress = (addressId, values) => mutateAddress((signal) => updateAddress(addressId, values, { signal }), 'update', addressId)
  const removeAddress = (addressId) => mutateAddress((signal) => deleteAddress(addressId, { signal }), 'delete', addressId)
  const makeDefault = (addressId) => mutateAddress((signal) => setDefaultAddress(addressId, { signal }), 'default', addressId)

  return { book, loading, loadError, saving, needsReload, pending, reload, addAddress, editAddress, removeAddress, makeDefault }
}
