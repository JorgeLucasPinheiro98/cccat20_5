import { AccountRepositoryDatabase } from "../../src/infra/repository/AccountRepository";
import DatabaseConnection, { PgPromiseAdapter } from "../../src/infra/database/DatabaseConnection";
import Registry from "../../src/infra/di/Registry";
import RequestRide from "../../src/application/usecase/RequestRide";
import { RideRepositoryDatabase } from "../../src/infra/repository/RideRepository";
import Signup from "../../src/application/usecase/signup";
import GetRide from "../../src/application/usecase/GetRide";
import AcceptRide from "../../src/application/usecase/AcceptRide";
import StartRide from "../../src/application/usecase/StartRide";
import UpdatePosition from "../../src/application/usecase/UpdatePosition";
import { PositionRepositoryDatabase } from "../../src/infra/repository/PositionRepository";
import FinishRide from "../../src/application/usecase/FinishRide";
import Mediator from "../../src/infra/mediator/Mediator";

let databaseConnection: DatabaseConnection;
let signup: Signup;
let requestRide: RequestRide;
let acceptRide: AcceptRide;
let startRide: StartRide;
let updatePosition: UpdatePosition;
let finishRide: FinishRide;
let getRide: GetRide;

beforeEach(() => {
    databaseConnection = new PgPromiseAdapter();
    Registry.getInstance().provide("databaseConnection", databaseConnection);
    const accountRepository = new AccountRepositoryDatabase();
    const rideRepository = new RideRepositoryDatabase();
    Registry.getInstance().provide("accountRepository", accountRepository);
    Registry.getInstance().provide("rideRepository", rideRepository);
    const positionRepository = new PositionRepositoryDatabase();
    Registry.getInstance().provide("positionRepository", positionRepository);
    const mediator = new Mediator();
    Registry.getInstance().provide("mediator", mediator)
    signup = new Signup();
    requestRide = new RequestRide();
    acceptRide = new AcceptRide();
    startRide = new StartRide();
    updatePosition = new UpdatePosition();
    finishRide = new FinishRide();
    getRide = new GetRide();
});

test("Deve finalizar uma corrida", async function () {
    const inputSignupPassenger = {
        name: "John Doe",
        email: `john.doe${Math.random()}@gmail.com`,
        cpf: "97456321558",
        password: "asdQWE123",
        isPassenger: true
    };
    const outputSignupPassenger = await signup.execute(inputSignupPassenger);

    const inputSignupDriver = {
        name: "John Doe",
        email: `john.doe${Math.random()}@gmail.com`,
        cpf: "97456321558",
        password: "asdQWE123",
        carPlate: "AAA9999",
        isPassenger: false,
        isDriver: true
    };
    const outputSignupDriver = await signup.execute(inputSignupDriver);

    const inputRequestRide = {
        passengerId: outputSignupPassenger.accountId,
        fromLat: -27.584905257808835,
		fromLong: -48.545022195325124,
		toLat: -27.496887588317275,
		toLong: -48.522234807851476
    }
    const outputRequestRide = await requestRide.execute(inputRequestRide);
    
    const inputAcceptRide = {
        rideId: outputRequestRide.rideId,
        driverId: outputSignupDriver.accountId
    }
    await acceptRide.execute(inputAcceptRide);

    const inputStartRide = {
        rideId: outputRequestRide.rideId
    }
    await startRide.execute(inputStartRide);

    const inputUpdatePosition1 = {
        rideId: outputRequestRide.rideId,
        lat: -27.584905257808835,
		long: -48.545022195325124,
        date: new Date("2023-03-01T22:50:00")
    }
    await updatePosition.execute(inputUpdatePosition1);

    const inputUpdatePosition2 = {
        rideId: outputRequestRide.rideId,
        lat: -27.496887588317275,
		long: -48.522234807851476,
        date: new Date("2023-03-01T23:05:00")
    }
    await updatePosition.execute(inputUpdatePosition2);

    const inputUpdatePosition3 = {
        rideId: outputRequestRide.rideId,
        lat: -27.584905257808835,
		long: -48.545022195325124,
        date: new Date("2023-03-01T23:20:00")
    }
    await updatePosition.execute(inputUpdatePosition3);
    const inputFinishRide = {
        rideId: outputRequestRide.rideId
    }
    await finishRide.execute(inputFinishRide);
    const outputGetRide = await getRide.execute(outputRequestRide.rideId);
    expect(outputGetRide.status).toBe("completed");
    expect(outputGetRide.distance).toBe(20);
    expect(outputGetRide.fare).toBe(78);
});

afterEach(async () => {
    await databaseConnection.close();
});
