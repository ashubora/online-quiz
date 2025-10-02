let quizQuestions = []; 

const questionText = document.getElementById('question-text');
const choicesContainer = document.getElementById('choices-container');
const nextButton = document.getElementById('next-btn');
const progressCurrent = document.getElementById('current-q');
const progressTotal = document.getElementById('total-q');
const quizContent = document.getElementById('quiz-content');
const resultScreen = document.getElementById('result-screen');
const scoreDisplay = document.getElementById('score-display');
const finalTotal = document.getElementById('final-total');
const timerDisplay = document.getElementById('time-left');
const restartButton = document.getElementById('restart-btn');

let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 60; // Total time in seconds
let timerInterval;



/**
 * Decodes HTML entities (e.g., &quot;, &#039;) from API strings.
 * This is crucial for Open Trivia DB data.
 * @param {string} html - The string containing HTML entities.
 * @returns {string} The decoded string.
 */
function decodeHtml(html) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
}

/**
 * Shuffles an array using the Fisher-Yates (Knuth) algorithm.
 * Used to randomize the order of choices.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function fetchQuestionsFromAPI() {
    try {
        // Fetch 10 multiple-choice questions
        const API_URL = 'https://opentdb.com/api.php?amount=10&type=multiple';
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.response_code !== 0) {
            throw new Error(`API Error Code: ${data.response_code}. Not enough questions available.`);
        }
        
        // Process and format the questions
        quizQuestions = data.results.map(q => {
            const correctAnswer = decodeHtml(q.correct_answer);
            const incorrectAnswers = q.incorrect_answers.map(decodeHtml);
            
            // Combine all choices and shuffle them
            const allChoices = shuffleArray([...incorrectAnswers, correctAnswer]);
            
            return {
                question: decodeHtml(q.question),
                choices: allChoices,
                answer: correctAnswer
            };
        });

        if (quizQuestions.length > 0) {
            startQuiz(); // Start the quiz once data is ready
        } else {
            throw new Error("API returned no usable questions.");
        }

    } catch (error) {
        console.error("Failed to load trivia questions:", error);
        questionText.textContent = "Error loading questions. Please check your network and try again.";
        progressCurrent.textContent = 0;
        progressTotal.textContent = 0;
    }
}



/**
 * Initializes the quiz setup.
 */
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    timeLeft = 60; // Reset time
    
    // Set up total question display based on fetched data
    progressTotal.textContent = quizQuestions.length;
    finalTotal.textContent = quizQuestions.length;

    // Show quiz content, hide result screen
    quizContent.classList.remove('hidden');
    resultScreen.classList.add('hidden');
    nextButton.disabled = true;

    // Start timer and display first question
    startTimer();
    showQuestion();
}

/**
 * Starts or resets the countdown timer.
 */
function startTimer() {
    clearInterval(timerInterval); // Clear any existing interval

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Optionally, penalize or just move on
            alert("Time's up! Moving to the next question."); 
            handleNextQuestion();
        }
    }, 1000);
}


/**
 * Displays the current question and its choices.
 */
function showQuestion() {
    const q = quizQuestions[currentQuestionIndex];
    
    // Update progress
    progressCurrent.textContent = currentQuestionIndex + 1;
    questionText.textContent = q.question;
    choicesContainer.innerHTML = ''; // Clear previous choices
    nextButton.disabled = true;

    // Create and append choice buttons
    q.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.classList.add('choice-btn');
        button.addEventListener('click', () => selectAnswer(button, choice, q.answer));
        choicesContainer.appendChild(button);
    });
}

/**
 * Handles the user selecting an answer.
 * @param {HTMLElement} selectedButton - The button clicked by the user.
 * @param {string} selectedChoice - The text of the choice.
 * @param {string} correctAnswer - The correct answer.
 */
function selectAnswer(selectedButton, selectedChoice, correctAnswer) {
    clearInterval(timerInterval); // Stop the timer when an answer is chosen

    // Disable all choice buttons to prevent re-selection
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = true;
    });

    if (selectedChoice === correctAnswer) {
        score++;
        selectedButton.classList.add('correct');
    } else {
        selectedButton.classList.add('incorrect');
        // Highlight the correct answer
        document.querySelectorAll('.choice-btn').forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }

    nextButton.disabled = false; // Enable the Next button
}

/**
 * Advances to the next question or ends the quiz.
 */
function handleNextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < quizQuestions.length) {
        // Reset timer for the new question
        timeLeft = 60; 
        showQuestion();
        startTimer(); // Restart timer
    } else {
        showResults();
    }
}

/**
 * Displays the final score and results screen.
 */
function showResults() {
    clearInterval(timerInterval); // Stop the timer
    
    quizContent.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    scoreDisplay.textContent = score;

    const percentage = (score / quizQuestions.length) * 100;
    const feedback = document.getElementById('feedback-message');
    
    if (percentage >= 80) {
        feedback.textContent = "Excellent work! You have a great grasp of the material.";
        feedback.style.color = 'var(--secondary-color)';
    } else if (percentage >= 50) {
        feedback.textContent = "Good effort! Keep practicing to improve your score.";
        feedback.style.color = 'orange';
    } else {
        feedback.textContent = "A bit more study is needed. Don't give up!";
        feedback.style.color = 'var(--danger-color)';
    }
}

// --- 6. EVENT LISTENERS & INITIALIZATION ---
nextButton.addEventListener('click', handleNextQuestion);
// When restarting, we re-fetch to get new questions!
restartButton.addEventListener('click', fetchQuestionsFromAPI); 

// Initial call to start the process
fetchQuestionsFromAPI();