require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { chromium } = require("playwright");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

// Function to dynamically identify CSS selectors using Hugging Face
async function getCssSelectors(htmlContent) {
  console.log("Using LLM to identify CSS selectors...");

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        inputs: `
          Analyze the following HTML and identify CSS selectors for:
          - Review container
          - Review title
          - Review body
          - Review rating
          - Review author:
          
          ${htmlContent.slice(0, 5000)} // Limit HTML content for brevity
        `,
      },
      {
        headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
      }
    );

    const selectors = JSON.parse(response.data);
    console.log("CSS Selectors Identified by LLM:", selectors);
    return selectors;
  } catch (error) {
    console.error("LLM failed. Falling back to default selectors...");
    return {
      reviewContainer: ".review-container, .jdgm-rev",
      title: ".review-title, .jdgm-rev__title",
      body: ".review-body, .jdgm-rev__body p",
      rating: ".review-rating, .jdgm-rev__rating",
      reviewer: ".review-author, .jdgm-rev__author",
    };
  }
}

// API endpoint to fetch reviews
app.get("/api/reviews", async (req, res) => {
  const { page } = req.query;
  if (!page) {
    return res.status(400).send({ error: "Page URL is required." });
  }

  try {
    console.log("Launching browser...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const pageInstance = await context.newPage();

    console.log(`Navigating to: ${page}`);
    await pageInstance.goto(page, { waitUntil: "load" });

    console.log("Fetching HTML content...");
    const content = await pageInstance.content();

    console.log("Identifying CSS selectors...");
    const cssSelectors = await getCssSelectors(content);

    console.log("Extracting reviews...");
    let reviews = [];
    let nextPage = true;

    while (nextPage) {
      const newReviews = await pageInstance.evaluate((selectors) => {
        const reviews = [];
        document.querySelectorAll(selectors.reviewContainer).forEach((review) => {
          reviews.push({
            title: review.querySelector(selectors.title)?.innerText || "",
            body: review.querySelector(selectors.body)?.innerText || "",
            rating: review.querySelector(selectors.rating)?.innerText || "",
            reviewer: review.querySelector(selectors.reviewer)?.innerText || "",
          });
        });
        return reviews;
      }, cssSelectors);

      reviews = reviews.concat(newReviews);

      // Check for pagination (Next button)
      const nextButton = await pageInstance.$("a.next-page, .pagination-next");
      if (nextButton) {
        console.log("Navigating to next page...");
        await nextButton.click();
        await pageInstance.waitForTimeout(3000); // Adjust delay as needed
      } else {
        nextPage = false;
      }
    }

    console.log(`Extracted ${reviews.length} reviews.`);
    await browser.close();

    res.send({
      reviews_count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Error extracting reviews:", error.message);
    res.status(500).send({ error: "Failed to fetch reviews." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
