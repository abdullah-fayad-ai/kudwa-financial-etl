import * as fs from "fs";
import * as path from "path";
import { Router } from "express";

import { createError } from "../middleware/error-handler.middleware";

const router = Router();

router.get("/:id", async (req, res): Promise<any> => {
  const { id } = req.params;
  const idNum = parseInt(id);

  if (idNum === 1) {
    return res.json(
      JSON.parse(
        fs.readFileSync(
          path.join(
            __dirname,
            "../../",
            "data",
            "Income_Statement_Company_1.json"
          ),
          "utf8"
        )
      )
    );
  } else if (idNum === 2) {
    return res.json(
      JSON.parse(
        fs.readFileSync(
          path.join(
            __dirname,
            "../../",
            "data",
            "Income_Statement_Company_2.json"
          ),
          "utf8"
        )
      )
    );
  }

  throw createError(`Invalid company ID: ${id}`, 400);
});

export default router;
