import structlog

logger = structlog.get_logger()

class WhaleMonitor:
    def __init__(self):
        self.threshold_usd = 10_000_000
        self.min_fee_sats = 50

    def process_tx(self, tx_data: dict, btc_price: float):
        usd_value = (tx_data.get('value', 0) / 100_000_000) * btc_price
        fee_rate = tx_data.get('fee_rate', 0)

        if usd_value > self.threshold_usd and fee_rate > self.min_fee_sats:
            logger.info("whale_move_detected", value_usd=usd_value, fee_rate=fee_rate)
            return True
        return False
