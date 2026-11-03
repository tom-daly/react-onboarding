/*
 * The starter set of tasks, offered when the checklist is empty. Common to
 * most workplaces; the team changes or deletes whatever doesn't fit. In the
 * order they show within each part of the month.
 *
 * The jobs before they start are done by whoever adds the set, so they see My
 * tasks straight away, until they hand each one to the right person.
 */

export interface ISampleTask {
  title: string;
  details: string;
  when: string;
  link: string;
  /** Done by whoever adds the starter set, rather than by the new starter. */
  byYou?: boolean;
}

export const SAMPLE_TASKS: ISampleTask[] = [
  {
    title: 'Order a laptop and phone for {{onboardee}}',
    details: 'Check with their manager what they need, so it\'s ready on their first morning.',
    when: 'Before they start',
    link: '',
    byYou: true
  },
  {
    title: 'Set up {{onboardee}}\'s work account and email',
    details: 'Add them to the right Teams and groups, and send their sign-in details to their manager.',
    when: 'Before they start',
    link: '',
    byYou: true
  },
  {
    title: 'Assign {{onboardee}}\'s software licences',
    details: 'Microsoft 365, and anything else their role needs.',
    when: 'Before they start',
    link: '',
    byYou: true
  },
  {
    title: 'Buy any equipment or software {{onboardee}} needs',
    details: 'Like a second screen, a headset or a specialist app. Ask their manager.',
    when: 'Before they start',
    link: '',
    byYou: true
  },
  {
    title: 'Send {{onboardee}} a welcome email',
    details: 'Where to go and when on their first day, who to ask for, and what to bring.',
    when: 'Before they start',
    link: '',
    byYou: true
  },
  {
    title: 'Fill in your new starter forms',
    details: 'Your bank details, emergency contact and tax forms, so you\'re paid on time.',
    when: 'Before they start',
    link: ''
  },
  {
    title: 'Collect your laptop and building pass',
    details: 'Pick them up from reception or IT on your first morning.',
    when: 'First day',
    link: ''
  },
  {
    title: 'Sign in and set up two-step sign-in',
    details: 'Sign in to your work account and set up the Microsoft Authenticator app on your phone.',
    when: 'First day',
    link: 'https://aka.ms/mfasetup'
  },
  {
    title: 'Meet your manager',
    details: 'A first chat about your role, your first few weeks and who\'s who.',
    when: 'First day',
    link: ''
  },
  {
    title: 'Get a tour of the office',
    details: 'Where things are: the kitchen, fire exits, meeting rooms and printers.',
    when: 'First day',
    link: ''
  },
  {
    title: 'Read the staff handbook',
    details: 'How we work: leave, expenses, working hours and the policies everyone follows.',
    when: 'First week',
    link: ''
  },
  {
    title: 'Do the health and safety training',
    details: 'What to do in an emergency, and how to set up your desk.',
    when: 'First week',
    link: ''
  },
  {
    title: 'Add a photo to your profile',
    details: 'So people can put a face to your name in Teams and Outlook.',
    when: 'First week',
    link: ''
  },
  {
    title: 'Meet the people you\'ll work with most',
    details: 'A short one-to-one with each of them. Your manager can suggest who.',
    when: 'First week',
    link: ''
  },
  {
    title: 'Do the security awareness training',
    details: 'How to spot phishing emails, and what to do if something looks wrong.',
    when: 'First month',
    link: ''
  },
  {
    title: 'Agree your goals with your manager',
    details: 'What good looks like at three months and at six.',
    when: 'First month',
    link: ''
  },
  {
    title: 'Tell us how your first month went',
    details: 'What helped and what was missing, so the next new starter has it easier.',
    when: 'First month',
    link: ''
  }
];
