import { ref, computed } from 'vue'
import { useAuth } from './useAuth'

// API base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const API_VERSION = '2025.12'

/**
 * API Client Composable
 * Handles authenticated requests to the manuals-api backend
 */
export function useApi() {
  const { accessToken } = useAuth()
  const loading = ref(false)
  const error = ref(null)

  /**
   * Make an authenticated API request
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

      // Add authentication header (Bearer token if available)
      if (accessToken.value) {
        headers['Authorization'] = `Bearer ${accessToken.value}`
      }

      // Make request
      const url = `${API_BASE_URL}/api/${API_VERSION}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers
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
   * Get device by ID
   */
  async function getDevice(id) {
    return get(`/devices/${id}`)
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
