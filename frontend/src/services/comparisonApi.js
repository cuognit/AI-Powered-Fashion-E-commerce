import axiosClient from './axiosClient.js'
import { requestComparisonProduct } from './comparisonRequest.js'

export const getComparisonProduct = (id, options) => requestComparisonProduct(axiosClient, id, options)
