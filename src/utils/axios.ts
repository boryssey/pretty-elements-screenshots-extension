import axios from "axios";
import fetchAdapter from "@haverstack/axios-fetch-adapter";

const axiosInstance = axios.create({
  // baseURL: 'http://localhost:8000',
  adapter: fetchAdapter,
  timeout: 300000,
});

export default axiosInstance;
