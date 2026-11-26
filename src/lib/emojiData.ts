export interface EmojiEntry {
  char: string
  name: string
}

export interface EmojiCategory {
  id: string
  label: string
  emojis: EmojiEntry[]
}

const make = (source: string): EmojiEntry[] =>
  source
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [char, ...name] = line.split(/\s+/)
      return { char, name: name.join(' ') }
    })

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'Smileys',
    emojis: make(`
      😀 grinning 😃 smiling 😄 happy 😁 beaming 😆 laughing 😅 sweat smile
      😂 joy 🤣 rolling laughing 🙂 slight smile 🙃 upside down 😉 wink 😊 blush
      😍 heart eyes 😘 blowing kiss 😋 yummy 😎 sunglasses 🥳 party 🤓 nerd
      😕 confused 😯 hushed 😴 sleeping 🤔 thinking 🤗 hug 🤯 mind blown 😭 crying
      😡 angry 😤 triumph 🤩 star struck 🥺 pleading 😬 grimace 😱 scream 😇 angel
      🤖 robot 👻 ghost 😈 devil
    `),
  },
  {
    id: 'people',
    label: 'People',
    emojis: make(`
      👋 wave ✌️ peace 🤞 fingers crossed 🤝 handshake 🙏 thanks 👍 thumbs up 👎 thumbs down
      👏 clap 💪 muscle 🫶 heart hands 👀 eyes 🧠 brain 🦾 mechanical arm 👶 baby 🧑 adult
      👩 woman 👨 man 👩‍💻 developer 👨‍🔬 scientist 🧑‍🎨 artist 🧑‍🍳 chef 🕵️ detective 🦸 hero
      🧙 wizard 💃 dancer 🏃 running 🚶 walking 🧘 meditation
    `),
  },
  {
    id: 'animals',
    label: 'Animals',
    emojis: make(`
      🐶 dog 🐱 cat 🐭 mouse 🐹 hamster 🐰 rabbit 🦊 fox 🐻 bear 🐼 panda 🦁 lion 🐯 tiger
      🐮 cow 🐷 pig 🐸 frog 🐵 monkey 🐔 chicken 🐧 penguin 🦉 owl 🦇 bat 🐺 wolf 🐗 boar
      🐴 horse 🦄 unicorn 🐝 bee 🐛 bug 🦋 butterfly 🐢 turtle 🐬 dolphin 🐳 whale 🦈 shark
      🐙 octopus 🦀 crab 🌸 blossom 🌻 sunflower 🌵 cactus 🍀 clover
    `),
  },
  {
    id: 'food',
    label: 'Food',
    emojis: make(`
      🍎 apple 🍊 orange 🍋 lemon 🍉 watermelon 🍇 grapes 🍓 strawberry 🫐 blueberry 🥑 avocado
      🍅 tomato 🥕 carrot 🌽 corn 🥦 broccoli 🧄 garlic 🧅 onion 🍞 bread 🧀 cheese 🥚 egg
      🍕 pizza 🍔 burger 🌮 taco 🍜 ramen 🍣 sushi 🍟 fries 🥗 salad 🍰 cake 🍩 donut 🍪 cookie
      ☕ coffee 🍵 tea 🧋 bubble tea 🍺 beer 🍷 wine 🥂 cheers 🍨 ice cream
    `),
  },
  {
    id: 'activities',
    label: 'Activities',
    emojis: make(`
      ⚽ football 🏀 basketball 🏈 american football ⚾ baseball 🎾 tennis 🏐 volleyball 🏓 ping pong
      🏸 badminton 🥊 boxing 🏋️ weightlifting 🚴 cycling 🏊 swimming ⛷️ skiing 🏄 surfing 🧗 climbing
      🎯 bullseye 🎮 video game 🎲 dice ♟️ chess 🎨 art 🎸 guitar 🎹 piano 🎤 microphone 🎧 headphones
      🎬 clapper 🎉 confetti 🎊 party 🎁 gift 🎈 balloon
    `),
  },
  {
    id: 'travel',
    label: 'Travel',
    emojis: make(`
      🚗 car 🚕 taxi 🚌 bus 🚚 truck 🚲 bicycle 🛵 scooter ✈️ airplane 🚀 rocket 🚁 helicopter ⛵ sailboat
      🚢 ship 🗺️ map 🧭 compass 🏔️ mountain 🏝️ island 🏖️ beach 🌋 volcano 🌊 wave 🌈 rainbow ☀️ sun
      🌙 moon ⭐ star 🌍 earth 🗼 tower 🏰 castle 🏙️ city 🌃 night city 🏕️ camping 🗽 statue
    `),
  },
  {
    id: 'objects',
    label: 'Objects',
    emojis: make(`
      💻 laptop 🖥️ desktop ⌨️ keyboard 🖱️ mouse 💡 bulb 🔋 battery 🔌 plug 📱 phone ☎️ phone call 📷 camera
      📚 books 📝 memo 📌 pin 📎 paperclip ✂️ scissors 🔒 lock 🔑 key 🔨 hammer 🔧 wrench ⚙️ gear 🛠️ tools
      🧲 magnet 🔬 microscope 📊 chart 📈 chart up 📉 chart down 💰 money 💳 card 💎 diamond 🕐 clock ⏰ alarm
    `),
  },
  {
    id: 'symbols',
    label: 'Symbols',
    emojis: make(`
      ❤️ red heart 🧡 orange heart 💛 yellow heart 💚 green heart 💙 blue heart 💜 purple heart 🖤 black heart
      🤍 white heart 💔 broken heart 💥 boom 💫 dizzy ✨ sparkles ⚡ lightning 🔥 fire 🌟 glowing star ✅ check
      ❌ cross ⚠️ warning ❓ question ❗ exclamation 💯 hundred 🔔 bell 🔕 muted ♻️ recycle ©️ copyright ®️ registered
      ™️ trademark ✔️ check mark ➕ plus ➖ minus ✖️ multiply ➗ divide
    `),
  },
  {
    id: 'flags',
    label: 'Flags',
    emojis: make(`
      🇺🇸 United States 🇬🇧 United Kingdom 🇨🇦 Canada 🇦🇺 Australia 🇩🇪 Germany 🇫🇷 France 🇪🇸 Spain 🇮🇹 Italy
      🇯🇵 Japan 🇰🇷 South Korea 🇨🇳 China 🇮🇳 India 🇧🇷 Brazil 🇲🇽 Mexico 🇿🇦 South Africa 🇳🇱 Netherlands
      🇸🇪 Sweden 🇨🇭 Switzerland 🇳🇴 Norway 🇩🇰 Denmark 🇵🇱 Poland 🇹🇷 Turkey 🇦🇪 UAE 🇸🇬 Singapore
      🏳️‍🌈 pride 🏳️‍⚧️ transgender ⚑ white flag 🏁 checkered
    `),
  },
]

export const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((category) => category.emojis)
