export type Category = 'stretching' | 'mobility' | 'strengthening';

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  image: string;
  duration: string;
  reps: string;
  instructions: string[];
  tip?: string;
  acuteWarning?: string;
}

export const exercises: Exercise[] = [
  {
    id: 'toe-extension',
    name: 'Plantar Fascia Toe Extension Stretch',
    category: 'stretching',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Toe+Extension',
    duration: '10 seconds per rep',
    reps: '10 reps each foot',
    instructions: [
      'Sit in a chair, cross one foot over the opposite knee.',
      'Grip your toes and pull them gently back toward your shin.',
      'You should feel a pull along the arch of your foot.',
      'Hold 10 seconds, release, and repeat.',
    ],
    tip: 'Do this before taking your very first steps in the morning — it dramatically reduces that initial sharp pain.',
  },
  {
    id: 'towel-stretch',
    name: 'Seated Towel Stretch',
    category: 'stretching',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Towel+Stretch',
    duration: '30 seconds per rep',
    reps: '3 reps each foot',
    instructions: [
      'Sit on the floor or bed with your leg extended straight.',
      'Loop a towel or belt around the ball of your foot.',
      'Gently pull the towel toward you, keeping your knee straight.',
      'Feel the stretch through your arch and calf.',
    ],
  },
  {
    id: 'calf-straight',
    name: 'Standing Calf Stretch — Straight Knee (Gastrocnemius)',
    category: 'stretching',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Calf+Stretch+Straight',
    duration: '30 seconds per rep',
    reps: '3 reps each side',
    instructions: [
      'Stand facing a wall, hands flat against it at shoulder height.',
      'Step one foot back, keeping the back heel flat on the floor.',
      'Keep the back leg straight and lean your hips gently forward.',
      'Hold and feel the stretch in the calf.',
    ],
    tip: 'Tight calves are one of the main drivers of plantar fascia tension — this is essential.',
  },
  {
    id: 'calf-bent',
    name: 'Standing Calf Stretch — Bent Knee (Soleus)',
    category: 'stretching',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Calf+Stretch+Bent',
    duration: '30 seconds per rep',
    reps: '3 reps each side',
    instructions: [
      'Use the same wall position as the straight-knee stretch.',
      'This time, slightly bend the back knee while keeping the heel flat.',
      'This targets the deeper soleus muscle closer to the heel.',
      'Hold and breathe steadily.',
    ],
    tip: 'Do this immediately after the straight-knee version for a complete calf release.',
  },
  {
    id: 'ankle-alphabet',
    name: 'Ankle Alphabet',
    category: 'mobility',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Ankle+Alphabet',
    duration: 'Full alphabet',
    reps: '1 alphabet per foot, once or twice a day',
    instructions: [
      'Sit in a chair with your foot lifted off the floor.',
      'Using only your ankle and foot, trace each letter of the alphabet in the air.',
      'Move slowly and fully through each letter.',
    ],
    tip: 'Great for restoring full ankle range of motion lost from guarding against pain.',
  },
  {
    id: 'ankle-circles',
    name: 'Ankle Circles',
    category: 'mobility',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Ankle+Circles',
    duration: 'Slow and controlled',
    reps: '10 clockwise + 10 counter-clockwise each foot',
    instructions: [
      'Sit comfortably with your foot lifted.',
      'Rotate your ankle slowly in wide circles.',
      'Do 10 clockwise, then 10 counter-clockwise per foot.',
      'Focus on moving through the full range without pain.',
    ],
    tip: 'Do this gently in the morning while still seated to warm up the joint before standing.',
  },
  {
    id: 'toe-spread',
    name: 'Toe Spread & Extension',
    category: 'mobility',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Toe+Spread',
    duration: '5 seconds per hold',
    reps: '10 reps of each variation per foot',
    instructions: [
      'Sit with your foot flat on the floor.',
      'Lift all toes off the floor, spread them as wide as you can, then lower slowly.',
      'Then lift only the big toe while keeping the other four down — hold 5 seconds.',
      'Reverse: press the big toe down, lift the four smaller toes.',
    ],
    tip: 'Restores neuromuscular control in the foot that often shuts down with chronic pain.',
  },
  {
    id: 'bottle-roll',
    name: 'Frozen Bottle Roll',
    category: 'mobility',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Bottle+Roll',
    duration: '2 minutes per foot',
    reps: 'Continuous rolling',
    instructions: [
      'Sit in a chair, place a frozen water bottle on the floor.',
      'Place the arch of your foot on the bottle and roll slowly from heel to ball.',
      'Apply gentle downward pressure — never painful, just firm.',
    ],
    tip: 'The cold helps reduce local inflammation while the rolling releases fascial tension. Best used after activity or at end of day.',
    acuteWarning: 'Keep pressure light during the acute phase. Stop if pain increases.',
  },
  {
    id: 'toe-scrunch',
    name: 'Towel Toe Scrunches',
    category: 'strengthening',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Toe+Scrunches',
    duration: 'Controlled movement',
    reps: '3 sets of 10 reps per foot',
    instructions: [
      'Place a small towel flat on the floor.',
      'Sit in a chair with your bare foot on the towel.',
      'Use only your toes to scrunch the towel toward you.',
      'Then smooth the towel back out and repeat.',
    ],
    tip: 'Activates intrinsic foot muscles that support the arch without loading the fascia directly.',
  },
  {
    id: 'heel-raise',
    name: 'Seated Heel Raises (Gentle)',
    category: 'strengthening',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Heel+Raises',
    duration: '2 second hold at top',
    reps: '3 sets of 10 reps',
    instructions: [
      'Sit in a chair with both feet flat on the floor.',
      'Slowly raise both heels off the floor as high as comfortable.',
      'Hold for 2 seconds at the top.',
      'Lower slowly and repeat. Keep movement pain-free.',
    ],
    acuteWarning: 'Seated only during the acute phase. Do not progress to standing until pain significantly reduces.',
  },
  {
    id: 'short-foot',
    name: 'Short Foot Exercise',
    category: 'strengthening',
    image: 'https://placehold.co/400x220/F9F6F1/7BAF8E?text=Short+Foot',
    duration: '5 second hold',
    reps: '10 reps per foot',
    instructions: [
      'Sit with your foot flat on the floor.',
      'Without curling your toes, try to shorten your foot by pulling the ball toward your heel.',
      'This domes the arch slightly.',
      'Hold 5 seconds, then release fully.',
    ],
    tip: 'Subtle and difficult at first. Directly activates intrinsic arch muscles. Do it slowly and mindfully.',
  },
];
