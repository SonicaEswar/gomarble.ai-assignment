require("dotenv").config();
const axios = require("axios");

// Mock OpenAI API response
async function getCssSelectors(htmlContent) {
  console.log("Mocking OpenAI response...");
  
  // Simulated response for testing purposes
  const mockResponse = `
    {
      "reviewContainer": ".review-container",
      "title": ".review-title",
      "body": ".review-body",
      "rating": ".review-rating",
      "reviewer": ".review-author"
    }
  `;
  
  return JSON.parse(mockResponse); // Return the mock response as an object
}

(async () => {
  try {
    const htmlContent = "<html><body><div>Sample HTML content</div></body></html>";
    console.log("Testing with mock OpenAI response...");
    
    const cssSelectors = await getCssSelectors(htmlContent);
    console.log("Mock CSS Selectors:", cssSelectors);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
