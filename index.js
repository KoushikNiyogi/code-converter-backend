const express = require('express');
const { Configuration, OpenAIApi } = require("openai");
const { ESLint } = require('eslint');
const app = express();
require("dotenv").config()
const axios = require("axios");
const cors = require("cors");
app.use(express.json());
app.use(cors({origin: "*"}))

app.post('/convert', async (req, res) => {
  // Set up your OpenAI API credentials
  const {code,language} = req.body;
  console.log(code);
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // Set up the OpenAI API endpoint for code conversion
  const apiUrl = 'https://api.openai.com/v1/engines/text-davinci-003/completions';

  try {

    // Make a POST request to the OpenAI API
    const response = await axios.post(apiUrl, {
      prompt: `##### Translate this code snippet to ${language}\n### \n    \n    ${code}    \n### ${language}",`,
      max_tokens: 150,
      temperature: 1,
      
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Extract the converted code from the OpenAI API response
    const convertedCode = response.data.choices[0].text;
    console.log(convertedCode)
    res.json({ convertedCode });
  } catch (error) {
    console.error('Error converting code:', error.message);
    console.error('Error converting code:', error.response.data);
    res.status(500).json({ error: 'An error occurred while converting the code.' });
  }
});

app.post('/debug', async (req, res) => {
  const { code } = req.body;
  
  try {
    // Get corrected code and suggestions
    const { correctedCode, mistakes } = await getCorrectedCode(code);
    
    res.json({ correctedCode, mistakes });
  } catch (error) {
    console.error('Error debugging code:', error.message);
    res.status(500).json({ error: 'An error occurred while debugging the code.' });
  }
});

// Function to get corrected code and suggestions
async function getCorrectedCode(code) {
  // Set up your OpenAI API credentials
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // Set up the OpenAI API endpoint for code conversion
  const apiUrl = 'https://api.openai.com/v1/engines/text-davinci-003/completions';
  
  try {
    // Make a POST request to the OpenAI API
    const response = await axios.post(apiUrl, {
      prompt: `You are working on a program that needs to perform a debugging on code snippet. However, the code snippet might contains some errors that need to be debugged. Your goal is to correct the code and ensure it functions correctly.
      Please review the following code and identify any errors.Also provide suggestion list: \n \n ${code}`,
      max_tokens: 400,
      temperature: 1,
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Extract the corrected code and mistakes from the OpenAI API response
    const correctedCode = response.data.choices[0].text;
    //const mistakes = response.data.choices[0].metadata.suggestedUserResponses;
    console.log(correctedCode);
    return { correctedCode };
  } catch (error) {
    console.error('Error in OpenAI API request:', error.message);
    throw new Error('An error occurred while requesting suggestions from the OpenAI API.');
  }
}



app.post('/quality', async (req, res) => {
  const { code } = req.body;

  try {
    // Perform quality checks on the code
    const codeSuggestions = await performQualityChecks(code);

    res.json(codeSuggestions);
  } catch (error) {
    console.error('Error performing code quality checks:', error.message);
    res.status(500).json({ error: 'An error occurred while performing code quality checks.' });
  }
});

// Function to perform quality checks on the code and generate suggestions
async function performQualityChecks(code) {
  // Define the code quality parameters
  const qualityParameters = [
    'code correctness',
    'readability',
    'documentation',
    'code duplication',
    'error handling',
  ];

  // Perform code quality checks for each parameter
  const codeSuggestions = [];

  for (const parameter of qualityParameters) {
    const prompt = `Check the ${parameter} of the following code and provide suggestions:\n\n${code}\n`;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    try {
      // Make a POST request to the OpenAI API
      const response = await axios.post(
        'https://api.openai.com/v1/engines/text-davinci-003/completions',
        {
          prompt,
          max_tokens: 150,
          temperature: 1,
          
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract the suggested improvements from the API response
      const suggestions = response.data.choices[0].text.trim();

      codeSuggestions.push({ parameter, suggestions });
    } catch (error) {
      console.error('Error making request to OpenAI API:', error.message);
      throw new Error('An error occurred while making a request to the OpenAI API.');
    }
  }

  return codeSuggestions;
}

app.listen(8080, () => {
  console.log(`Server is running on port ${8080}`);
});
