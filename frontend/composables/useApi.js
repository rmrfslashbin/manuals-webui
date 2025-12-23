import { ref } from 'vue'

// API version - requests go through nginx proxy at same origin
const API_VERSION = '2025.12'

/**
 * API Client Composable
 * Handles requests to the manuals-api backend.
 * Authentication is handled via HTTP-only cookies (BFF pattern).
 */
export function useApi() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Make an API request
   * @param {string} endpoint - API endpoint (e.g., '/devices')
   * @param {object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async function request(endpoint, options = {}) {
    loading.value = true
    error.value = null

    try {
      // Build headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      // Make request with credentials (cookies sent for BFF auth)
      const url = `/api/${API_VERSION}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Always send cookies for session auth
      })

      // Handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Parse JSON response
      const data = await response.json()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * GET request
   */
  async function get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return request(url, { method: 'GET' })
  }

  /**
   * POST request
   */
  async function post(endpoint, data) {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * PUT request
   */
  async function put(endpoint, data) {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * DELETE request
   */
  async function del(endpoint) {
    return request(endpoint, { method: 'DELETE' })
  }

  /**
   * Search devices (keyword search)
   */
  async function searchDevices(query, filters = {}) {
    return get('/search', { q: query, ...filters })
  }

  /**
   * Semantic search
   */
  async function semanticSearch(query, limit = 10) {
    return get('/search/semantic', { q: query, limit })
  }

  /**
   * Get all devices
   */
  async function getDevices(filters = {}) {
    return get('/devices', filters)
  }

  /**
   * Get device by ID (includes full documentation content)
   */
  async function getDevice(id) {
    return get(`/devices/${id}`, { content: 'true' })
  }

  /**
   * Get device pinout
   */
  async function getDevicePinout(id) {
    return get(`/devices/${id}/pinout`)
  }

  /**
   * Get device specifications
   */
  async function getDeviceSpecs(id) {
    return get(`/devices/${id}/specs`)
  }

  /**
   * Get device documents
   */
  async function getDeviceDocuments(id) {
    return get(`/devices/${id}/documents`)
  }

  /**
   * Get all guides
   */
  async function getGuides() {
    return get('/guides')
  }

  /**
   * Get guide by ID
   */
  async function getGuide(id) {
    return get(`/guides/${id}`)
  }

  /**
   * Get all documents
   */
  async function getDocuments() {
    return get('/documents')
  }

  /**
   * Get current user info
   */
  async function getMe() {
    return get('/me')
  }

  /**
   * Get API status
   */
  async function getStatus() {
    return get('/status')
  }

  return {
    // State
    loading,
    error,

    // Generic methods
    request,
    get,
    post,
    put,
    del,

    // Specific API methods
    searchDevices,
    semanticSearch,
    getDevices,
    getDevice,
    getDevicePinout,
    getDeviceSpecs,
    getDeviceDocuments,
    getGuides,
    getGuide,
    getDocuments,
    getMe,
    getStatus
  }
}
