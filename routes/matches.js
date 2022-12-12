const Match = require("../models/Match.js");
const express = require("express");
const router = express.Router();


// //UPDATE
//     router.patch("/:matchNumber", async(req, res, next) => {
//         try {
//         const updatedMatch = await Match.findOneAndUpdate(
//         { matchNumber: req.params.matchNumber },
//         {"availability.category1.count": 132},
//         { new: true }
//         );
//         res.status(200).json(updatedMatch);
//         } catch (err) {
//           res.status(500).json(err);
//         }
//       })

router.patch("/", async (req, res) => {
  var qMatchNumber = req.query.matchNumber;
  var qCatNumber = req.query.categoryNumber;
  var qCount = req.query.count;
  try {
    let query;
      if (qCatNumber == 1) {
      query = await Match.findOneAndUpdate(
          { matchNumber: qMatchNumber },
          { "availability.category1.count": qCount },
          { new: true }
      );
      }
      else if (qCatNumber == 2) {
        query = await Match.findOneAndUpdate(
            { matchNumber: qMatchNumber },
            { "availability.category2.count": qCount },
            { new: true }
        );
        }
        else if (qCatNumber == 3) {
          query = await Match.findOneAndUpdate(
              { matchNumber: qMatchNumber },
              { "availability.category3.count": qCount },
              { new: true }
          );
          }

    res.status(200).json(query);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/:id", async(req, res, next) => {
    try {
        await Match.findByIdAndDelete(req.params.id);
        res.status(200).json("Match has been deleted.");
    } catch (err) {
      res.status(500).json(err);
    }
})

//DELETE ALL
router.delete("/", async (req, res) => {
  try {
    const deleted = await Match.deleteMany({});
    res.status(200).json(deleted);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET by id
router.get("/", async(req, res, next) => {
    try {
        const match = await Match.find(
          {
            matchNumber: req.query.matchNumber
          }
        );
        res.status(200).json(match);
      } catch (err) {
        res.status(500).json(err);
      }
})



//GET all
// router.get("/", async(req, res, next) => {
//     try {
//         const matches = await Match.find();
//         res.status(200).json(matches);
//       } catch (err) {
//         next(err);
//       }
// })
router.get("/", async (req, res) => {
  var qHomeTeam = req.query.homeTeam;

  try {
    let country;

    // if (qHomeTeam) {
    //   country = await Match.find({
    //     HomeTeam: req.query.HomeTeam,
    //     AwayTeam: req.query.HomeTeam
    //   },
    //   )}
        if (qHomeTeam) {
      country = await Match.find({$or:[{homeTeam: qHomeTeam},{ awayTeam:qHomeTeam}]}
      )}

 else {
      country = await Match.find();
    }

    res.status(200).json(country);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
