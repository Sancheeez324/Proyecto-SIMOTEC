import axios from "axios";

export const sendRequest = async (url, method, data) => {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: token ? `${token}` : "",
    };

    const config = {
      method,
      maxBodyLength: Infinity,
      url,
      headers,
      data,
    };
    
    const response = await axios(config);
    
    return {
      status: response.status,
      data: response.data,
    };
    
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};
