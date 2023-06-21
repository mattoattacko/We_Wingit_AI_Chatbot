import { Configuration, OpenAIApi } from 'openai'
import { process } from './env'

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

const chatbotConversation = document.getElementById('chatbot-conversation')

// changed our array to a string
// needed to change "const" to "let"
let conversationStr = ''
 
document.addEventListener('submit', (e) => {
    e.preventDefault()
    const userInput = document.getElementById('user-input')  
    
    // update conversationArr to conversationStr with just the users input
    // also made it dynamic because we need a ' ->' to make things work correctly.
    conversationStr += ` ${userInput.value} ->`
    fetchReply()
    // console.log(conversationStr)
    const newSpeechBubble = document.createElement('div')
    newSpeechBubble.classList.add('speech', 'speech-human')
    chatbotConversation.appendChild(newSpeechBubble)
    newSpeechBubble.textContent = userInput.value
    userInput.value = ''
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight
}) 

async function fetchReply(){
    const response = await openai.createCompletion({
        model: 'davinci:ft-wcc-2023-06-21-01-13-35', //changed from 'davinci'
        prompt: conversationStr, //changed from 'messages'
        presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 100,
        temperature: 0,
        stop: ['\n', '->'], //GPT4 has a stop sequence built in so we dont need to add it for that, but we do need it for our custom data. We also add the '->' to keep arrows from popping up in completions, and to tell the AI that it has reached the end of a prompt.
    })
    // we need to explicitly add a white space to the beginning to fulfill the prompt-completion pair requirement
    // we also needed to add an '\n' to the end to make sure the AI knows that it has reached the end of a completion.
    conversationStr += ` ${response.data.choices[0].text} \n` // we change '.push()' to '+=', 'message' to 'text' because that's what we get back from the API, we also remove the () around response.
    renderTypewriterText(response.data.choices[0].text)
}

function renderTypewriterText(text) {
    const newSpeechBubble = document.createElement('div')
    newSpeechBubble.classList.add('speech', 'speech-ai', 'blinking-cursor')
    chatbotConversation.appendChild(newSpeechBubble)
    let i = 0
    const interval = setInterval(() => {
        newSpeechBubble.textContent += text.slice(i-1, i)
        if (text.length === i) {
            clearInterval(interval)
            newSpeechBubble.classList.remove('blinking-cursor')
        }
        i++
        chatbotConversation.scrollTop = chatbotConversation.scrollHeight
    }, 50)
}


// ~~~ NOTES ~~~ //

// 1. Get data. As much as possible in CSV/JSON format. (comma separated values)
// 2. Prep data. Use OpenAI's data preparation tool to process our data so that the format is correct and won't get rejected. It's a CLI tool with a specific data formatting process.
// 3. Upload data to OpenAI and tell it to make our fine-tuned model. We do this with the CLI tool. 
// 4. When the process ends, we will have our own special endpoint that we can use with our chat bot. At this point we can adjust our code to use the new model. 

// ~~~ Giving OpenAI Data ~~~ //
// 1. We should provide at least a few hundred high-quality examples, ideally vetted by humans. 
// 2. Increasing the number of examples will help the model learn better.
// 3. The data we give OpenAI must be in a JSONL document, where each line is a prompt-completion pair corresponding to a training example. We can use a tool to create JSONL files.

// ~~~ Format Our Data ~~~ //
// {"prompt": "<prompt text>", "completion": "<ideal generated text>"}
// We are just going to use the CLI data preparation tool to format our data.
// 1. Each prompt should end with a separator to show where the prompt ends and the completion begins. 
// 2. Each completion should start with a whitespace.
// 3. Each completion should end with a "stop sequence" to inform the model where the completion ends.

// ~~~ Stop Sequence ~~~ //
//  'Stop Sequence' tells the API to stop generating tokens at a given point. 
//  The completion will not contain the stop sequence.
//  The 'stop sequence' is an array.
//  EG: if we had 4 things we wanted and numbered them 1) 2) 3) 4), and we wrote
//  'stop: ['3)']' as our stop sequence, we would only get back 1) and 2) since the stop sequence does not include that completion.
//  Very common to use the 'new line value' of '\n' as a stop sequence because the AI will give us one paragraph as an answer.

// when we initially set up our model, we went with the [Recommended] Add a suffix separator ` ->` to all prompts, and [Recommended] Add a suffix ending `\n` to all completions.

// our data is basically a 2 column spreadsheet with "Prompt" in the first column (containing our customer questions) and "Completion" in the second column (containing our responses).
// The CSV will be formatted as follows:
// line 1: Prompt, Completion
// line 2: "bla bla bla question", "bla bla bla response"
// line 3: "bla bla bla question", "bla bla bla response"
// line 4: etc etc


// For full dialogue, here is an example:
// first part is a summary of the conversation
// "Summary: Customer is concerned about a missing package. /n/n

// Customer: I got a delivery notification but I don't know where it is. Whats up?

// \nAgent: Can you check with neighborhood?

// \nCustomer: I don't know. I'm not sure where it is. \nAgent: ",

// "It sounds like something went wrong. Please call us at 555-555-5555 and one of our support agents will investigate."



// ~~~ n_epochs ~~~ //
// Its the number ("n") of data cycles.
// It controls the number of times OpenAI will cycle through the training data set. 
// defaults to 4, which is not enough for smaller data sets. 
// higher numbers = higher cost
// We set "n_epochs" when we send the training data to be fine tuned. We don't set it in our app. 