---
layout: post
toc: true
title: "FastAI Notes"
description: "Learning Deep Learning in Public"
categories: [Learning Data Science]
image: /images/posts/sKDI04h.png
hide: true
---

<style>
table {font-size:100%; white-space:inherit}
table td {max-width:inherit}
</style>

This is my tracker for following this much-celebrated MooC.

It marks the start of my data science education and follows the ['Learning in Public'](https://www.swyx.io/learn-in-public/) ethos.

| Part                           | Chapter                                     | Section                                        |
|----------------------------------|--------------------------------------------|-------------------------------------------------|
| 1. Deep Learning in Practice                     | 1. [Your Deep Learning Journey](#Chapter-One:-Your-Deep-Learning-Journey)                          | Deep Learning is for Everyone [O'Reailly](https://learning.oreilly.com/library/view/deep-learning-for/9781492045519/ch01.html#idm46055308627688)                                    |
|                                  |                                            | Neural Networks: A Brief History                                   |
|                                  |                                            | Who We Are                    |
|                                  |                                            | How to Learn Deep Learning                        |
|                                  |                                            | Your Projects and Your Mindset                    |    
|                                  |                                            | The Software: PyTorch, fastai, and Jupyter (And Why It Doesn't Matter)                    |    
|                                  |                                            | Your First Model                    |    
|                                  |                                            | Getting a GPU Deep Learning Server                    |    
|                                  |                                            | Running Your First Notebook                    |    
|                                  |                                            | What Is Machine Learning?                   |    
|                                  |                                            | What Is a Neural Network?                    |    
|                                  |                                            | A Bit of Deep Learning Jargon                    |    
|                                  |                                            | Limitations In herent to Machine Learning                    |    
|                                  |                                            | How Our Image Recognizer Works                    |    
|                                  |                                            | What Our Image Recognizer Learned                    |    
|                                  |                                            | Image Recognizers Can Tackle Non-Image Tasks                    |    
|                                  |                                            | Jargon Recap                    |    
|                                  |                                            | Deep Learning Is Not Just for Image Classification                    |    
|                                  |                                            | Validation Sets and Test Sets                    |    
|                                  |                                            | A Choose Your Own Adventure Moment                    |    
|        |                       | Questionnaire [O'Reilly](https://learning.oreilly.com/library/view/deep-learning-for/9781492045519/ch01.html#idm46055317162952) • [Answers](http://www.google.com)                  |
|                                  | 2. From Model to Production                                            | The Practice of Deep Learning          |
|                                  |                                            | Starting Your Project           |
|                                  |                                            | The State of Deep Learning                       |
|                                  |                                            | The Drivetrain Approach                       |
|                                  |                                            | Gathering Data                       |
|                                  |                                            | From Data to DataLoaders                       |
|                                  |                                            | Data Augmentation                       |
|                                  |                                            | Training Your Model, and Using It to Clean Your Data                       |
|                                  |                                            | Turning Your Model into an Online Application                       |
|                                  |                         | Using the Model for Inference                                  |
|                                  |                                            | Creating a Notebook App from the Model
|                                  |                                            | Turning Your Notebook into a Real App                          |
|                                  |             | Deploying Your App                          |
|                                  |                                            | How to Avoid Disaster            |
|                                  |                                            | Unforeseen Consequences and Feedback Loops      |
|                                  |                                            | Get Writing!                           |
|        |                       | Questionnaire [O'Reilly](https://learning.oreilly.com/library/view/deep-learning-for/9781492045519/ch01.html#idm46055317162952) • [Answers](http://www.google.com)                  |
|                                  | 3. From Model to Production                                            | Key Examples for Data Ethics          |
|                                  |                                                                        | Bugs and Recourse: Euggy Algorithm Used for Healthcare Benfits          |
|                                  |                                                                        | Feedback Loops: YouTube's Recommendation System          |
|                                  |                                                                        | Bias: Professor Latanya Sweeney "Arrested"          |
|                                  |                                                                        | Why Does This Matter?          |
|                                  |                                                                        | Integrating Machine Learning with Product Design          |
|                                  |                                                                        | Topics in Data Ethics          |
|                                  |                                                                        | Recourse and Accountability          |
|                                  |                                                                        | Feedback Loops          |
|                                  |                                                                        | Bias          |
|                                  |                                                                        | Disinformation          |
|                                  |                                                                        | Identifying and Addressing Ethical Issues          |
|                                  |                                                                        | Analyze a Project You Are Working On          |
|                                  |                                                                        | Processes to Implement          |
|                                  |                                                                        | The Power of Diversity          |
|                                  |                                                                        | Fairness, Accountability and Transparency          |
|                                  |                                                                        | Role of Policy          |
|                                  |                                                                        | The Effectiveness of Regulation          |
|                                  |                                                                        | Rights and Policy          |
|                                  |                                                                        | Cars: A Historical Precedent          |
|                                  |                                                                        | Conclusion          |
|        |                       | Questionnaire [O'Reilly](https://learning.oreilly.com/library/view/deep-learning-for/9781492045519/ch01.html#idm46055317162952) • [Answers](http://www.google.com)                  |
| 2. Understanding Fastai's Applications | 4. Under The Hood: Training A Digit Classifier       | Pixels: The Foundations of Computer Vision        |
|                                  |                                            | First Try: Pixel Similarity             |
|                                  |                                            | NumPy Arrays and PyTorch Sensors                           |
|                                  |                                            | Computing Metics Using Broadcasting                     |
|                                  |                                            | Stochastic Gradient Descent                      |
|                                  |                                            | Calculating Gradients                    |
|                                  |                                            | Stepping with a Learning Rate                    |
|                                  |                                            | An End-to-End SGD Example                    |
|                                  |                                            | Summarizing Gradient Descent                   |
|                                  |                                            | The MNIST Loss Function                   |
|                                  |                                            | Sigmoid                   |
|                                  |                                            | SGD and Mini-Batches                   |
|                                  |                                            | Putting It All Together                   |
|                                  |                                            | Creating an Optimizer                   |
|                                  |                                            | Adding a Nonlinearity                   |
|                                  |                                            | Going Deeper                   |
|                                  |                                            | Jargon Recap                   |
|        |                       | Questionnaire [O'Reilly](https://learning.oreilly.com/library/view/deep-learning-for/9781492045519/ch01.html#idm46055317162952) • [Answers](http://www.google.com)                  |
|                                  | 5. Image Classification                    | From Dogs and Cats to Pet Breeds                                     |
|                                  |                                            | Presizing                             |
|                                  |                                            | Checking and Debugging a DataBlock                          |
|                                  |                                            | Cross-Entropy Loss                           |
|                                  |                                            | Viewing Activations and Labels                                     |
|                                  |                                            | Softmax                                |
|                                  |                                            | Log Likelihood                           |
|                                  |                                            | Taking the log                 |
|                                  |                                            | Model Interpretation                            |
|                                  |                                            | Improving Our Model                         |
|                                  |                                            | The Learning Rate Finder                           |
|                                  |                                            | Unfreezing and Transfer Learning                           |
|                                  |                                            | Discriminative Learning Rates                           |
|                                  |                                            | Selecting the Number of Epochs                           |
|                                  |                                            | Deeper Architectures                           |
|                                  |                                            | Conclusion                           |
|        |                       | Questionnaire [O'Reilly](https://learning.oreilly.com/library/view/deep-learning-for/9781492045519/ch01.html#idm46055317162952) • [Answers](http://www.google.com)                  |
|                                  |                                            | Further Research                           |
|                                  | 6. Other Computer Vision Problems                    | Multi-Label Classification                                     |
|      python                            |                                            |                                                 |

## End of Chapter Questions


### Chapter One: Your Deep Learning Journey [O'Reilly](https://learning.oreilly.com/library/view/deep-learning-for/9781492045519/ch01.html#idm46055317215864)


#### 1.1 Do you need these for deep learning?

- Lots of Math T/F
- Lots of data T/F
- Lots of expensive computers T/F
- A PhD T/F



<details>
<summary>Show answer</summary>

```python

answers = '''
F Lots of Math T/F
- Lots of data T/F
- Lots of expensive computers T/F
- A PhD T/F
'''

```

</details>

#### 1.2 Name five areas where deep learning is now the best in the world.

<details>
<summary>Show answer</summary>

```python

answers = '''
- NLP. Natrual language processing is used to:
    - answer questions
    - speech recognition
    - summarize documents
    - classify documents
    - finding names/dates
- Computer Vision
    - Satellite and drone imagery interpreation
    - face recognition
    - image captioning
    - Reading traffic signs
    - Locating pedestrians/vehicales for autonomous vehicles
- Medicine
    - Finding anomalises in radiology images
    - Counting features in pathology slides
    - Measure features in ultrasounds
    - Diagnosing diabetic retinopathy
- Biology
    - Folding proteins
    - Classifying proteins
    - Genomics tasks like tumour sequencing
    - Classifying actionable genetic mutations
    - Cell classifications
    - Analyzing protein/protein interactions
- Image Generation
    - Colourising images
    - increasing image resolution
    - Removing noise from images
    - Converting images to art in certain styles
- Recommendation systems
    - Web search
    - Product recommendations,
    - Home page layout
- Playing Games
    - Chess, Go, most Atari video games and real-time strategy
- Robotics
    - Handling objects that are challenging to locate (eg transparent or shiny) or hard to pick up
'''
```

</details>

#### 1.3 What was the name of the first device that was based on the principle of the artificial neuron?

<details>
<summary>Show answer</summary>

```python

answer='''
The Mark 1 Perceptron
'''
```

</details>

#### 1.4 Based on the book of the same name, what are the requirements for parallel distributed processing? (PDP)

<details>
<summary>Show answer</summary>

```python

answer='''
- A set of processing units
- A state of activuation
- An output function for each unit
- A pattern of connectivity among units
- A propogration rule for propogating patterns of activities through the network of connectivities
- An activation rule for combining the inputs impinging on a unity with the current state of that unit to produce an output for the unit
- A learning rule whereby patterns of connectivity are modified by experience
- An environment within which the system must operate
'''
```

</details>

#### 1.5 What were the two theoretical misunderstandings that held back the field of neural networks?

<details>
<summary>Show answer</summary>

```python

answer='''
- In the book "Perceptrons", Marvin Minsky and Samuel Papert pointed out that only a single layer of artificial neurons couldn't learn simple mathematical functions, even though the latter part of the book addressed the limitation by highlighting the use of multiple layers.
- 30 years ago, researchers showed more layers were needed to get 'deep' learning and now neural nets are living up to their potential.
'''
```

</details>

#### 1.6 What is a GPU?

<details>
<summary>Show answer</summary>

```python

answer='''
A processor that can handle thousands of tasks at the same time. The tasks are very similar to what neural networks do and GPUs can run neural networks hundreds of times faster than regular CPUs.
The modern deep learning libraries only support NVIDIA GPUs
'''
```

</details>

#### 1.7 Open a notebook and execute a cell containing: 1+1

```python
1+1
```

#### 1.8 Follow through each cell of the stripped down version of the notebook for this chapter. Before executing each cell, guess what will happen.

- [course.fast.ai - Using Colab](https://course.fast.ai/start_colab)
- [Stripped Copy of 01_intro.ipynb on my Google Drive](https://colab.research.google.com/drive/1MvngrPu-vvXtE-DNV7dje5VQTeVJ7cHG?authuser=1) [original](https://colab.research.google.com/github/fastai/fastbook/blob/master/clean/01_intro.ipynb)
    - Change Runtime Type to GPU
    - Then run cells

#### 1.9 Complete the Jupyter Notebook online appendix

- [copy of app_jupyter.ipynb on my drive](https://colab.research.google.com/drive/1FsYPafxZNUlOfm8VeRbh_W-KtuNPniwM?authuser=1)

#### 1.10 Why is it hard to use a traditional computer program to recognize images in a photo?

<details>
<summary>Show answer</summary>

```python

answer='''
- For a traditional computer program, we'd have to translate the exact steps necessary to recognize images into code but we don't really know what those steps are since it happens in our brain.
- There would be the need to 'spell out every minute step of the process in the most exasperating detail'
'''
```

</details>

#### 1.11 What did Samuel mean by 'Weight Assignment' ?

<details>
<summary>Show answer</summary>

```python

answer='''
- Weights ("Parameters" in ML jargon) are variables and an assignment is a particular choice of values for those variables.

- They are the inputs for the program ('model') and altering them will define how the program operates.

- In Arthur Samuel's work, his checkers-playing program had different values of weights that would result in different checkers-playing strategies.

'''
```

</details>

#### 1.12 What term do we normally use in deep learning for what Samuel called "Weights"

<details>
<summary>Show answer</summary>

```python
answer='''
Parameters
'''
```

</details>

#### 1.13 Draw a picture that summarizes Samuel's view of a machine learning model.

<details>
  <summary>Answer</summary>
  <p>
  <img src="{{ site.baseurl }}/images/posts/Dw3CaOt.png">
  </p>
</details>

#### 1.14 Why is it hard to understand why a deep learning model makes a particular prediction?

<details>
  <summary>Answer:</summary>
  <p>
  
  > It is easy to create a model that makes predictions on exact data it's been trained on, but it's hard to make accurate predicitions on data the model hasn't seen before.
  </p>
  
</details>


