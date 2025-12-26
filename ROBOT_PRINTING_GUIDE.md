# Robot 3D Printing Guide on Octavia

**Your robot-making station:** http://192.168.4.74:5000

## 🤖 Popular Robot Projects to Print

### Beginner-Friendly Robots
1. **Otto DIY** - Walking bipedal robot
   - https://www.ottodiy.com
   - Arduino-powered, easy to program
   - Great starter project

2. **Articulated Action Figures**
   - Printables: Search "articulated robot"
   - No electronics, just cool poseable bots

3. **Simple Robot Arms**
   - EEZYbotARM: https://www.thingiverse.com/thing:1015238
   - MeArm: https://www.thingiverse.com/thing:360108

### Advanced Projects
4. **InMoov** - Life-size humanoid robot
   - http://inmoov.fr
   - Raspberry Pi compatible!
   - Can run on octavia

5. **OpenDog** - Quadruped robot dog
   - https://github.com/XRobots/openDog

## 🎨 Recommended Slicer Settings for Robots

**For articulated parts (joints, hinges):**
- Layer Height: 0.2mm
- Infill: 15-20%
- Supports: YES (especially for overhangs)
- Print Temperature: 200-210°C (PLA)

**For structural parts:**
- Layer Height: 0.2-0.3mm
- Infill: 30-50%
- Perimeters: 3-4 walls
- Top/Bottom Layers: 5-6

**For gears and mechanical parts:**
- Layer Height: 0.1-0.15mm (finer detail)
- Infill: 50-100%
- Slow print speed for accuracy

## 🛠️ Essential Skills for Robot Printing

1. **Print-in-place joints** - Parts that move without assembly
2. **Tolerance tuning** - Getting parts to fit together
3. **Support removal** - Clean joints and moving parts
4. **Multi-part assembly** - Large robots printed in pieces

## 📁 Organizing Your Robot Projects

```
/mnt/nvme/blackroad/octoprint/data/
├── robots/
│   ├── articulated/        # Poseable figures
│   ├── walking/            # Bipeds, quadrupeds
│   ├── humanoid/           # Android-style bots
│   ├── arms/               # Robot arms, grippers
│   ├── calibration/        # Test prints
│   └── electronics/        # Housings for Arduino, Pi, etc.
```

## 🔌 Electronics Integration

Since octavia is a Raspberry Pi, you can:
- Program robot brains directly on the same Pi
- Use GPIO pins for robot control
- Run ROS (Robot Operating System)
- Control servos and motors via Python

## 🚀 Your Robot Workflow

1. **Design/Download** - Get STL files
2. **Slice** - Use Cura or PrusaSlicer
3. **Upload to OctoPrint** - http://192.168.4.74:5000
4. **Print** - Monitor via web interface
5. **Assemble** - Put your robot together
6. **Program** - Code it on octavia!
7. **Deploy** - Watch it move!

## 🎯 First Robot Projects

**Week 1:** Print calibration cube + test robot joints
**Week 2:** Print & assemble Otto DIY
**Week 3:** Add sensors and program basic movements
**Week 4:** Design your own custom robot!

## 🌐 Communities

- r/3Dprinting
- r/robotics
- r/arduino
- Otto DIY Discord
- InMoov Forum

---

**BlackRoad x Robots** 🖤🛣️🤖

Ready to make your robot army on octavia!
