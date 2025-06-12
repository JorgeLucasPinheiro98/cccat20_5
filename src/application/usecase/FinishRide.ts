import { inject } from "../../infra/di/Registry";
import RideRepository from "../../infra/repository/RideRepository";
import PositionRepository from "../../infra/repository/PositionRepository";
import ProcessPayment from "./ProcessPayment";
import Mediator from "../../infra/mediator/Mediator";

export default class FinishRide {
    @inject("positionRepository")
    positionRepository!: PositionRepository;
    @inject("rideRepository")
    rideRepository!: RideRepository;
    @inject("mediator")
    mediator!: Mediator

    async execute (input: Input): Promise<void> {
        const ride = await this.rideRepository.getRideById(input.rideId);
        ride.finish();
        await this.rideRepository.updateRide(ride);
        // um use case chamou o outro
        // const processPayment = new ProcessPayment();
        // await processPayment.execute(input.rideId);
        await this.mediator.notyfyALL("process_payment", { rideId: input.rideId })
    }
}

type Input = {
    rideId: string
}
