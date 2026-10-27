import * as addressService from '../services/addressService.js'

export async function getAddresses(request, response, next) {
  try {
    response.json(await addressService.getAddresses(request.user.sub))
  } catch (error) {
    next(error)
  }
}

export async function createAddress(request, response, next) {
  try {
    response.status(201).json(await addressService.createAddress(request.user.sub, request.body))
  } catch (error) {
    next(error)
  }
}

export async function updateAddress(request, response, next) {
  try {
    response.json(await addressService.updateAddress(request.user.sub, request.params.addressId, request.body))
  } catch (error) {
    next(error)
  }
}

export async function deleteAddress(request, response, next) {
  try {
    response.json(await addressService.deleteAddress(request.user.sub, request.params.addressId))
  } catch (error) {
    next(error)
  }
}

export async function setDefaultAddress(request, response, next) {
  try {
    response.json(await addressService.setDefaultAddress(request.user.sub, request.params.addressId))
  } catch (error) {
    next(error)
  }
}
